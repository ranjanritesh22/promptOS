/**
 * The optimizer orchestrator: runs the rule pipeline (gated by aggressiveness),
 * optionally restructures, and reports token savings + applied changes.
 */

import { buildIntentPrompt, detectIntent } from "./intents.js";
import { ALL_RULES } from "./rules.js";
import { buildTokenStats } from "./tokenizer.js";
import type {
  Aggressiveness,
  AppliedChange,
  OptimizeOptions,
  OptimizeResult,
} from "./types.js";

const LEVEL_RANK: Record<Aggressiveness, number> = {
  light: 0,
  balanced: 1,
  aggressive: 2,
};

/** Should a rule run at the chosen aggressiveness level? */
function ruleEnabled(ruleMin: Aggressiveness, chosen: Aggressiveness): boolean {
  return LEVEL_RANK[chosen] >= LEVEL_RANK[ruleMin];
}

/**
 * Optimize a prompt: compress filler, tighten wording, optionally restructure,
 * and report how many tokens were saved.
 *
 * Pure and synchronous — safe to call on every keystroke if desired.
 */
export function optimize(input: string, options: OptimizeOptions = {}): OptimizeResult {
  const { aggressiveness = "balanced", enhance = false } = options;
  const original = input;

  // Intent is always reported so every surface can show "what this looks like".
  const intent = detectIntent(original);

  let text = input;
  const changes: AppliedChange[] = [];

  for (const rule of ALL_RULES) {
    if (!ruleEnabled(rule.minLevel, aggressiveness)) continue;
    const result = rule.apply(text);
    text = result.text;
    changes.push(...result.changes);
  }

  if (enhance && text.trim().length > 0) {
    // Enhance rewrites the (already-cleaned) prompt into a canonical,
    // intent-specific template. Skipped for empty input (nothing to build from).
    const before = text;
    text = buildIntentPrompt(before, intent);
    if (text.trim() !== before.trim()) {
      changes.push({
        rule: "enhance",
        description: `Rewrote as a ${intent.label} prompt with clear structure`,
        count: 1,
      });
    }
  }

  text = text.trim();

  return {
    original,
    optimized: text,
    stats: buildTokenStats(original, text),
    changes,
    intent,
  };
}
