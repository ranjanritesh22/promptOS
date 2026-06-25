/**
 * The optimizer orchestrator: runs the rule pipeline (gated by aggressiveness),
 * optionally restructures, and reports token savings + applied changes.
 */

import { ALL_RULES } from "./rules.js";
import { restructurePrompt } from "./structure.js";
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
  const { aggressiveness = "balanced", restructure = false } = options;
  const original = input;

  let text = input;
  const changes: AppliedChange[] = [];

  for (const rule of ALL_RULES) {
    if (!ruleEnabled(rule.minLevel, aggressiveness)) continue;
    const result = rule.apply(text);
    text = result.text;
    changes.push(...result.changes);
  }

  if (restructure) {
    const before = text;
    text = restructurePrompt(text);
    if (text !== before) {
      changes.push({
        rule: "restructure",
        description: "Reorganized into Role / Context / Task / Constraints / Format",
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
  };
}
