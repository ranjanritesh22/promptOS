/**
 * Core type definitions for the PromptOS prompt-optimization engine.
 *
 * These types are shared by every PromptOS surface (the Chrome extension and
 * the web app) so that optimization behaviour is identical everywhere.
 */

/** AI platforms PromptOS knows how to target. */
export type Platform =
  | "generic"
  | "chatgpt"
  | "claude"
  | "gemini"
  | "cursor"
  | "perplexity";

/**
 * How aggressively the optimizer is allowed to rewrite text.
 *
 * - `light`   — only safe, lossless cleanups (whitespace, obvious filler).
 * - `balanced`— light cleanups plus wordy→concise phrase replacement.
 * - `aggressive`— everything in balanced plus removal of hedges/intensifiers
 *   and de-duplication. Highest token savings, slightly higher chance of
 *   altering nuance.
 */
export type Aggressiveness = "light" | "balanced" | "aggressive";

/**
 * The kind of thing a prompt is asking for. Used by the intent engine to pick
 * the right rewrite template (coding, planning, health, ...).
 */
export type IntentCategory =
  | "coding"
  | "debugging"
  | "planning"
  | "writing"
  | "learning"
  | "health"
  | "business"
  | "data"
  | "general";

/** The detected intent of a prompt. */
export interface IntentMatch {
  category: IntentCategory;
  /** Human-readable label, e.g. `"Health & fitness"`. */
  label: string;
  /** How sure we are, 0–1 (0 means we fell back to `"general"`). */
  confidence: number;
}

/** User-tunable options for a single optimization pass. */
export interface OptimizeOptions {
  /**
   * How hard to clean up. Default: `"balanced"`. Not surfaced in the UI — the
   * apps always use the default; it exists so individual rules can be gated.
   */
  aggressiveness?: Aggressiveness;
  /**
   * Rewrite the prompt into a canonical, intent-specific template
   * (detects coding / planning / writing / health / ... and structures the
   * request accordingly). Default: `false`. When off, PromptOS just cleans up
   * grammar, spelling, and wordiness.
   */
  enhance?: boolean;
  /** The platform the prompt is destined for (reserved for future tuning). */
  platform?: Platform;
}

/** A single transformation that was applied to the prompt. */
export interface AppliedChange {
  /** Stable id of the rule that fired, e.g. `"collapse-whitespace"`. */
  rule: string;
  /** Human-readable summary, e.g. `Replaced "in order to" → "to"`. */
  description: string;
  /** How many times this rule fired. */
  count: number;
}

/** Token accounting for a before/after comparison. */
export interface TokenStats {
  originalTokens: number;
  optimizedTokens: number;
  /** Tokens removed (can be negative when `restructure` adds scaffolding). */
  saved: number;
  /** Percentage of original tokens saved, rounded to one decimal. */
  savedPercent: number;
}

/** The full result of an optimization pass. */
export interface OptimizeResult {
  original: string;
  optimized: string;
  stats: TokenStats;
  changes: AppliedChange[];
  /** The detected intent of the prompt (always reported, even when `enhance` is off). */
  intent: IntentMatch;
}

/** Signature every optimization rule implements. */
export interface Rule {
  id: string;
  /** Lowest aggressiveness level at which this rule is allowed to run. */
  minLevel: Aggressiveness;
  apply: (input: string) => RuleOutput;
}

/** What a rule returns: the new text plus any changes it recorded. */
export interface RuleOutput {
  text: string;
  changes: AppliedChange[];
}
