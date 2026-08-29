/**
 * Builds a browsable view of the whole codebase as one self-contained HTML file.
 *
 *   npm run map
 *
 * Writes .map/codebase.html, which gets published as an Artifact so the code
 * can be clicked through in a browser instead of an editor.
 */

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, ".map");
const OUT_FILE = join(OUT_DIR, "codebase.html");

const INCLUDE_DIRS = ["src", "scripts"];
const INCLUDE_ROOT_FILES = ["README.md", "ARCHITECTURE.md", "ROADMAP.md", "package.json", "tsconfig.json", "next.config.ts", "components.json"];
const SKIP = new Set(["node_modules", ".next", ".git", ".map", "data", "dist", "build"]);
const MAX_BYTES = 400_000;
/** Only text. Images, fonts and icons have nothing to read. */
const TEXT_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".css", ".md", ".txt", ".yml", ".yaml", ".html",
]);

/** One line saying what each file is for. Shown above the code. */
const DESCRIPTIONS = {
  "src/core/types.ts": "The nouns. Every object the system knows about.",
  "src/core/ids.ts": "How every id is built. Same inputs always give the same id.",
  "src/core/flow.ts": "The rulebook. What stage a project is at, and what you can do next.",
  "src/core/store.ts": "Saving and loading. One JSON file per project under data/.",
  "src/ai/provider.ts": "The line between the app and the AI. Six stages, and what each one is allowed to see.",
  "src/ai/schemas.ts": "The shape every AI response must have before it can be saved.",
  "src/ai/mock/index.ts": "Stand-in AI. Fake responses, real shapes.",
  "src/ai/index.ts": "Picks which AI the app uses.",
  "src/features/onboarding/actions.ts": "Turns whatever you paste into a saved profile.",
  "src/features/onboarding/OnboardingForm.tsx": "The paste-your-resume screen.",
  "src/features/onboarding/ProfileSummary.tsx": "What the app understood about you.",
  "src/core/mutate.ts": "The one door every change goes through. Checks the gate, then saves.",
  "src/features/goal/GoalForm.tsx": "The box. Four questions, nothing inferred.",
  "src/features/goal/actions.ts": "Goal in, researched brief out. Creates the project.",
  "src/features/brief/BriefPanel.tsx": "What the goal actually is.",
  "src/features/brief/actions.ts": "Approving the brief. The only thing that unlocks planning.",
  "src/features/plan/PlanPanel.tsx": "The timeline, with the advantage shown on each step.",
  "src/features/plan/actions.ts": "Plan generation and approval. Ids and statuses assigned here, not by the AI.",
  "src/features/workspace/NextActionCard.tsx": "The one thing to do now.",
  "src/features/workspace/actions.ts": "Dispatcher for the next-action button.",
  "src/components/panel.tsx": "Shared workspace furniture.",
  "src/features/nodes/actions.ts": "Leverage node generation and approval. Checks every step is covered.",
  "src/features/nodes/NodesPanel.tsx": "Search directions, grouped by step.",
  "src/features/scan/actions.ts": "Running a scan, and saving/ignoring/deferring one result at a time.",
  "src/features/scan/ScanPanel.tsx": "The latest scan, grouped the way it was searched.",
  "src/features/scan/ResultCard.tsx": "One result and the three things you can do about it.",
  "src/features/opportunities/OpportunitiesPanel.tsx": "What you actually took on, with its trail back to the scan.",
  "src/core/validate.ts": "The health check. Verifies every relationship still holds. Reports, never repairs.",
  "src/features/opportunities/actions.ts": "Recording what happened to something you took on.",
  "src/features/opportunities/CloseForm.tsx": "Finished it, or dropped it, plus what changed.",
  "src/features/review/actions.ts": "Step reviews, and the one deterministic transition in the app.",
  "src/features/review/ReviewPanel.tsx": "The verdict on the current step.",
  "src/features/review/ReviewDecisionButtons.tsx": "Agree, disagree, or apply.",
  "src/features/workspace/HealthPanel.tsx": "Everything that should still be true about this project.",
  "scripts/check-loop.mts": "Proves the health check actually catches things.",
  "ARCHITECTURE.md": "How it all fits together.",
  "ROADMAP.md": "What is left to build.",
  "README.md": "How to run it.",
  "scripts/generate-map.mjs": "Builds this page.",
};

// ---------------------------------------------------------------- collect

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (stat.size <= MAX_BYTES && TEXT_EXTS.has(extname(entry))) files.push(full);
  }
  return files;
}

const paths = [];
for (const dir of INCLUDE_DIRS) {
  try {
    paths.push(...walk(join(ROOT, dir)));
  } catch {
    /* directory does not exist yet */
  }
}
for (const file of INCLUDE_ROOT_FILES) {
  try {
    statSync(join(ROOT, file));
    paths.push(join(ROOT, file));
  } catch {
    /* not present */
  }
}

const files = paths
  .map((full) => ({
    path: relative(ROOT, full).split(sep).join("/"),
    code: readFileSync(full, "utf-8"),
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

// ---------------------------------------------------------------- highlight

const KEYWORDS =
  /\b(abstract|as|async|await|break|case|catch|class|const|continue|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|new|null|of|private|protected|public|readonly|return|satisfies|set|static|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|yield)\b/;

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const esc = (s) => s.replace(/[&<>]/g, (c) => ESC[c]);

const TOKENS = new RegExp(
  [
    /\/\*[\s\S]*?\*\//.source, // block comment
    /\/\/[^\n]*/.source, // line comment
    /`(?:\\[\s\S]|[^\\`])*`/.source, // template string
    /"(?:\\[\s\S]|[^\\"])*"/.source, // double string
    /'(?:\\[\s\S]|[^\\'])*'/.source, // single string
    /\b\d[\d_.]*\b/.source, // number
    /[A-Za-z_$][\w$]*/.source, // word
  ].join("|"),
  "g",
);

function highlight(code, ext) {
  if (ext === ".json") {
    return esc(code).replace(/(&quot;|")([^"]*?)\1(\s*:)?/g, (m, q, body, colon) =>
      colon ? `<span class="k">"${body}"</span>${colon}` : `<span class="s">"${body}"</span>`,
    );
  }
  let out = "";
  let last = 0;
  for (const m of code.matchAll(TOKENS)) {
    const text = m[0];
    out += esc(code.slice(last, m.index));
    last = m.index + text.length;
    if (text.startsWith("/*") || text.startsWith("//")) out += `<span class="c">${esc(text)}</span>`;
    else if (/^[`"']/.test(text)) out += `<span class="s">${esc(text)}</span>`;
    else if (/^\d/.test(text)) out += `<span class="n">${esc(text)}</span>`;
    else if (KEYWORDS.test(text)) out += `<span class="k">${esc(text)}</span>`;
    else if (/^[A-Z]/.test(text)) out += `<span class="t">${esc(text)}</span>`;
    else out += esc(text);
  }
  return out + esc(code.slice(last));
}

// ---------------------------------------------------------------- tree

function buildTree(list) {
  const root = {};
  for (const { path } of list) {
    const parts = path.split("/");
    let node = root;
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      node[part] ??= isFile ? { __file: path } : {};
      if (!isFile) node = node[part];
    });
  }
  return root;
}

function renderTree(node, depth = 0) {
  const dirs = Object.keys(node)
    .filter((k) => !node[k].__file)
    .sort();
  const fileKeys = Object.keys(node)
    .filter((k) => node[k].__file)
    .sort();
  let html = "";
  for (const name of dirs) {
    html += `<details open><summary style="--d:${depth}">${esc(name)}</summary>`;
    html += renderTree(node[name], depth + 1);
    html += `</details>`;
  }
  for (const name of fileKeys) {
    const path = node[name].__file;
    html += `<button class="file" data-path="${esc(path)}" style="--d:${depth}">${esc(name)}</button>`;
  }
  return html;
}

// ---------------------------------------------------------------- render

const panels = files
  .map(({ path, code }) => {
    const lines = code.split("\n");
    const gutter = lines.map((_, i) => i + 1).join("\n");
    const desc = DESCRIPTIONS[path];
    return `<section class="panel" id="f-${esc(path)}" hidden>
<header class="fh"><h2>${esc(path)}</h2><span class="meta">${lines.length} lines</span></header>
${desc ? `<p class="desc">${esc(desc)}</p>` : ""}
<div class="codewrap"><pre class="gutter">${gutter}</pre><pre class="code"><code>${highlight(code, extname(path))}</code></pre></div>
</section>`;
  })
  .join("\n");

const totalLines = files.reduce((sum, f) => sum + f.code.split("\n").length, 0);

const html = `<title>Playbook Codebase</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
:root{
  --bg:#fbfbf9; --panel:#f2f2ee; --border:#e3e3dc; --text:#1e2024; --dim:#6f7480;
  --accent:#9a6d18; --accent-soft:#f4ecdb;
  --k:#9a6d18; --s:#4f7038; --c:#8d9199; --n:#a75a30; --t:#2b6394;
  --mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
  --sans:"IBM Plex Sans",ui-sans-serif,system-ui,"Segoe UI",sans-serif;
}
:root:not([data-theme="light"]){ @media (prefers-color-scheme:dark){
  --bg:#16171b; --panel:#1c1e23; --border:#2b2e35; --text:#dfe1e6; --dim:#878c99;
  --accent:#d9a441; --accent-soft:#26241d;
  --k:#d9a441; --s:#9ab87c; --c:#646a78; --n:#cf8360; --t:#7aa2d6;
}}
:root[data-theme="dark"]{
  --bg:#16171b; --panel:#1c1e23; --border:#2b2e35; --text:#dfe1e6; --dim:#878c99;
  --accent:#d9a441; --accent-soft:#26241d;
  --k:#d9a441; --s:#9ab87c; --c:#646a78; --n:#cf8360; --t:#7aa2d6;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 var(--sans);}
.app{display:grid;grid-template-columns:280px 1fr;height:100vh}
aside{background:var(--panel);border-right:1px solid var(--border);overflow-y:auto;padding:14px 0 40px}
.brand{padding:0 16px 12px;border-bottom:1px solid var(--border);margin-bottom:10px}
.brand h1{margin:0;font-family:var(--mono);font-size:12px;font-weight:600;
  text-transform:uppercase;letter-spacing:.14em;color:var(--accent)}
.brand p{margin:5px 0 0;font-size:11px;color:var(--dim);font-variant-numeric:tabular-nums}
.search{margin:0 12px 10px;width:calc(100% - 24px);padding:6px 9px;font-size:12px;
  border:1px solid var(--border);border-radius:7px;background:var(--bg);color:var(--text)}
.search:focus{outline:2px solid var(--accent);outline-offset:-1px}
details{margin:0}
summary{cursor:pointer;padding:3px 12px 3px calc(14px + var(--d)*13px);font-size:12.5px;
  color:var(--dim);font-weight:500;list-style:none;user-select:none}
summary::-webkit-details-marker{display:none}
summary::before{content:"▾";display:inline-block;width:12px;font-size:9px;color:var(--dim)}
details:not([open])>summary::before{content:"▸"}
summary:hover{color:var(--text)}
.file{display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;
  padding:3px 12px 3px calc(26px + var(--d)*13px);font:inherit;font-family:var(--mono);
  font-size:12px;color:var(--text)}
.file:hover{background:var(--border)}
.file:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.file[aria-current="true"]{background:var(--accent-soft);color:var(--accent);font-weight:600;
  box-shadow:inset 2px 0 0 var(--accent)}
main{overflow-y:auto;padding:0}
.panel{padding:26px 30px 70px;max-width:1100px}
.fh{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.fh h2{margin:0;font-size:15px;font-family:var(--mono);font-weight:600;letter-spacing:-0.01em}
.meta{font-size:11px;color:var(--dim);font-variant-numeric:tabular-nums}
.desc{margin:8px 0 0;color:var(--dim);font-size:13.5px;max-width:66ch;line-height:1.6}
.codewrap{display:flex;margin-top:16px;border:1px solid var(--border);border-radius:9px;
  background:var(--panel);overflow-x:auto}
pre{margin:0;font-family:var(--mono);font-size:12.5px;line-height:1.65;tab-size:2}
.gutter{padding:14px 10px 14px 16px;color:var(--dim);text-align:right;user-select:none;font-variant-numeric:tabular-nums;
  border-right:1px solid var(--border);flex:none;opacity:.55}
.code{padding:14px 18px;flex:1;min-width:0}
.empty{padding:80px 30px;color:var(--dim)}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
.k{color:var(--k)}.s{color:var(--s)}.c{color:var(--c);font-style:italic}
.n{color:var(--n)}.t{color:var(--t)}
@media(max-width:820px){.app{grid-template-columns:1fr;height:auto}
  aside{border-right:0;border-bottom:1px solid var(--border);max-height:44vh}}
</style>
<div class="app">
  <aside>
    <div class="brand"><h1>Playbook</h1><p>${files.length} files &middot; ${totalLines.toLocaleString()} lines</p></div>
    <input class="search" type="search" placeholder="Filter files..." aria-label="Filter files">
    <nav id="tree">${renderTree(buildTree(files))}</nav>
  </aside>
  <main>
    <div class="empty" id="empty">Pick a file to read it.</div>
    ${panels}
  </main>
</div>
<script>
const buttons = [...document.querySelectorAll(".file")];
const empty = document.getElementById("empty");

function show(path){
  document.querySelectorAll(".panel").forEach(p => p.hidden = true);
  buttons.forEach(b => b.removeAttribute("aria-current"));
  const panel = document.getElementById("f-" + path);
  if(!panel) return;
  panel.hidden = false;
  empty.hidden = true;
  buttons.find(b => b.dataset.path === path)?.setAttribute("aria-current","true");
  document.querySelector("main").scrollTop = 0;
  try { localStorage.setItem("playbook:file", path); } catch {}
}

buttons.forEach(b => b.addEventListener("click", () => show(b.dataset.path)));

document.querySelector(".search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  buttons.forEach(b => { b.style.display = b.dataset.path.toLowerCase().includes(q) ? "" : "none"; });
  document.querySelectorAll("#tree details").forEach(d => {
    const anyVisible = [...d.querySelectorAll(".file")].some(f => f.style.display !== "none");
    d.style.display = anyVisible ? "" : "none";
    if(q) d.open = true;
  });
});

let restored = null;
try { restored = localStorage.getItem("playbook:file"); } catch {}
show(restored && document.getElementById("f-" + restored) ? restored : (buttons[0]?.dataset.path ?? ""));
</script>`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, html, "utf-8");
console.log(`Wrote ${relative(ROOT, OUT_FILE)} - ${files.length} files, ${totalLines} lines`);
