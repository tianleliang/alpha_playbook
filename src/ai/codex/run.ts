/**
 * Talking to the locally installed Codex CLI.
 *
 * Codex runs as a separate process in a temp directory with a read-only
 * sandbox, so it cannot touch this project's files. It is handed a JSON Schema
 * and writes its answer to a file, which we then re-validate with Zod before
 * anything reaches your data.
 *
 * This is the same call shape the Obsidian scripts proved out, made async so a
 * server action can await it.
 */

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { z } from "zod";

/** Where npm puts the Codex CLI on Windows. Override with PLAYBOOK_CODEX_BIN. */
function codexEntrypoint(): string {
  const override = process.env.PLAYBOOK_CODEX_BIN?.trim();
  if (override) return override;

  const appData = process.env.APPDATA;
  if (appData) {
    const windows = join(appData, "npm", "node_modules", "@openai", "codex", "bin", "codex.js");
    if (existsSync(windows)) return windows;
  }
  const unix = join(
    process.env.HOME ?? "",
    ".npm-global/lib/node_modules/@openai/codex/bin/codex.js",
  );
  if (existsSync(unix)) return unix;

  throw new Error(
    "Codex CLI was not found. Install it with `npm i -g @openai/codex`, or set PLAYBOOK_CODEX_BIN to its codex.js path.",
  );
}

/**
 * Structured output wants every object closed and every field required.
 * Zod produces most of this; this walks the result and enforces the rest.
 */
function strictify(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strictify);
  if (!node || typeof node !== "object") return node;

  const schema = { ...(node as Record<string, unknown>) };
  for (const key of Object.keys(schema)) schema[key] = strictify(schema[key]);

  if (schema.type === "object") {
    schema.additionalProperties = false;
    const properties = schema.properties as Record<string, unknown> | undefined;
    if (properties) schema.required = Object.keys(properties);
  }
  return schema;
}

export function jsonSchemaFor(schema: z.ZodType): Record<string, unknown> {
  const raw = z.toJSONSchema(schema, { target: "draft-7", io: "output" });
  return strictify(raw) as Record<string, unknown>;
}

export interface CodexOptions {
  /** Turn on live web search. Only brief research and scans should use this. */
  search?: boolean;
  timeoutMs?: number;
  /** Shown in errors so a failure names the stage that failed. */
  label: string;
}

/**
 * Some failures are the provider having a bad moment, not anything wrong with
 * the request. Those are worth one quiet retry; everything else is not.
 */
const TRANSIENT = [
  /at capacity/i,
  /rate.?limit/i,
  /too many requests/i,
  /\b429\b/,
  /\b5\d\d\b.*(error|unavailable)/i,
  /temporarily unavailable/i,
  /overloaded/i,
  /connection (reset|closed|refused)/i,
  /socket hang up/i,
  /ETIMEDOUT|ECONNRESET|EAI_AGAIN/,
];

function isTransient(message: string): boolean {
  return TRANSIENT.some((pattern) => pattern.test(message));
}

/**
 * Codex writes diagnostics, search traces and partial output to stderr, so the
 * raw text is unreadable. Pull out the part a person can act on.
 */
function readableFailure(label: string, stderr: string, code: number | null): string {
  const text = stderr.trim();

  if (/at capacity/i.test(text)) {
    return `${label} could not run: the model is at capacity right now. Wait a moment and try again, or set PLAYBOOK_CODEX_MODEL in .env.local to a different model.`;
  }
  if (/rate.?limit|too many requests|\b429\b/i.test(text)) {
    return `${label} hit a rate limit. Wait a minute and try again.`;
  }
  if (/not logged in|unauthor|401|authentication/i.test(text)) {
    return `${label} could not authenticate. Run \`codex login\` in a terminal, then try again.`;
  }
  if (/usage limit|quota|insufficient/i.test(text)) {
    return `${label} could not run: your Codex usage limit has been reached.`;
  }

  // Nothing recognised. Show the last real line rather than a wall of JSON.
  const lastLine =
    text
      .split(/\r?\n/)
      .map((l) => l.replace(/\[[0-9;]*m/g, "").trim())
      .filter((l) => l && !l.startsWith("{") && !/^web search:/i.test(l) && !/^tokens used/i.test(l))
      .pop() ?? "";

  return `${label} failed${lastLine ? `: ${lastLine.slice(0, 300)}` : ` (exit ${code}).`}`;
}

/**
 * Runs one stage and returns a validated result.
 *
 * Everything is thrown away afterwards: the temp directory, the schema file,
 * and the output file. Nothing about a run persists except what you save.
 */
export async function runCodex<T>(
  prompt: string,
  context: string,
  schema: z.ZodType<T>,
  options: CodexOptions,
): Promise<T> {
  try {
    return await attempt(prompt, context, schema, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // One retry, and only when the provider was the problem. A schema failure
    // or a bad request will fail the same way twice, so retrying wastes time.
    if (!isTransient(message)) throw error;
    await new Promise((r) => setTimeout(r, 4000));
    return attempt(prompt, context, schema, options);
  }
}

async function attempt<T>(
  prompt: string,
  context: string,
  schema: z.ZodType<T>,
  options: CodexOptions,
): Promise<T> {
  const entrypoint = codexEntrypoint();
  const runtime = await mkdtemp(join(tmpdir(), "playbook-codex-"));
  const schemaPath = join(runtime, "schema.json");
  const outputPath = join(runtime, "output.json");

  try {
    await writeFile(schemaPath, JSON.stringify(jsonSchemaFor(schema), null, 2), "utf-8");

    const args = [
      entrypoint,
      ...(options.search ? ["--search"] : []),
      "exec",
      "--ephemeral",
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--cd",
      runtime,
      "--output-schema",
      schemaPath,
      "--output-last-message",
      outputPath,
    ];

    const model = process.env.PLAYBOOK_CODEX_MODEL?.trim();
    if (model) args.push("--model", model);
    args.push("-");

    await execute(args, `=== TASK ===\n\n${prompt}\n\n=== CONTEXT ===\n\n${context}`, {
      cwd: runtime,
      timeoutMs: options.timeoutMs ?? 10 * 60_000,
      label: options.label,
    });

    if (!existsSync(outputPath)) {
      throw new Error(`${options.label} finished without returning anything.`);
    }

    const raw = JSON.parse(await readFile(outputPath, "utf-8"));

    // The CLI honours the schema, but a model is still on the other end.
    // Nothing reaches your data without passing our own check too.
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .slice(0, 4)
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      throw new Error(`${options.label} came back in the wrong shape - ${issues}`);
    }
    return parsed.data;
  } finally {
    await rm(runtime, { recursive: true, force: true });
  }
}

function execute(
  args: string[],
  input: string,
  options: { cwd: string; timeoutMs: number; label: string },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: options.cwd,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(
        new Error(
          `${options.label} took longer than ${Math.round(options.timeoutMs / 1000)}s and was stopped.`,
        ),
      );
    }, options.timeoutMs);

    child.stdout.on("data", () => {});
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      if (stderr.length > 8000) stderr = stderr.slice(-8000);
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`${options.label} could not start Codex: ${error.message}`));
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) return resolve();
      reject(new Error(readableFailure(options.label, stderr, code)));
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}
