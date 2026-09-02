/**
 * Picks which AI the app uses.
 *
 * Set PLAYBOOK_PROVIDER in .env.local:
 *
 *   openai  the OpenAI API. Needs OPENAI_API_KEY. Works anywhere, including
 *           a deployed server. This is what production uses.
 *   codex   the Codex CLI installed on this machine. No API key, so it is
 *           free to iterate with locally, but it is a binary and cannot run
 *           on a deployed host.
 *   mock    canned responses. No calls, no cost, instant. For UI work.
 *
 * Nothing else in the app knows or cares which one is active.
 */

import { codexProvider } from "./codex";
import { mockProvider } from "./mock";
import { openaiProvider } from "./openai";
import type { AiProvider } from "./provider";

export function getProvider(): AiProvider {
  switch (process.env.PLAYBOOK_PROVIDER?.trim().toLowerCase()) {
    case "mock":
      return mockProvider;
    case "codex":
      return codexProvider;
    case "openai":
      return openaiProvider;
    default:
      // Prefer the real thing when a key is present, so a missing or
      // misspelled setting degrades to something that works rather than
      // something that silently returns fixtures.
      return process.env.OPENAI_API_KEY ? openaiProvider : mockProvider;
  }
}

export type { AiProvider } from "./provider";
