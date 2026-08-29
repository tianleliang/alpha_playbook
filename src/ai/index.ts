/**
 * Picks which AI the app uses.
 *
 * Right now there is one: the demo provider, which returns believable fake
 * responses without calling anything. A real one drops in beside it and this
 * function starts returning that instead. Nothing else in the app changes,
 * because nothing else in the app knows which provider it is talking to.
 */

import { mockProvider } from "./mock";
import type { AiProvider } from "./provider";

export function getProvider(): AiProvider {
  // Next session: read PLAYBOOK_PROVIDER and return the Codex provider when
  // it is set to "codex".
  return mockProvider;
}

export type { AiProvider } from "./provider";
