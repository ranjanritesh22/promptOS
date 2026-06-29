/**
 * @promptos/core — the shared prompt-optimization engine.
 *
 * This package is consumed by both the Chrome extension and the web app so that
 * "optimize" means exactly the same thing on every surface.
 */

export { optimize } from "./optimizer.js";
export { estimateTokens, buildTokenStats } from "./tokenizer.js";
export { detectIntent, buildIntentPrompt, extractGoal } from "./intents.js";
export { ALL_RULES } from "./rules.js";
export {
  WORDY_PHRASES,
  FILLER_OPENERS,
  HEDGES_AND_INTENSIFIERS,
  POLITENESS,
} from "./dictionaries.js";

export type {
  Platform,
  Aggressiveness,
  IntentCategory,
  IntentMatch,
  OptimizeOptions,
  OptimizeResult,
  TokenStats,
  AppliedChange,
  Rule,
  RuleOutput,
} from "./types.js";

/** Library version, surfaced in extension/web UIs. */
export const VERSION = "0.1.0";
