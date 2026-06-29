/**
 * Individual, composable optimization rules.
 *
 * Each rule is a pure function: text in, text + recorded changes out. Rules are
 * ordered and gated by aggressiveness in {@link ./optimizer}. Keeping them
 * isolated makes each one independently testable and easy to reason about.
 */

import {
  CONTRACTIONS,
  FILLER_OPENERS,
  HEDGES_AND_INTENSIFIERS,
  POLITENESS,
  WORDY_PHRASES,
} from "./dictionaries.js";
import type { AppliedChange, Rule, RuleOutput } from "./types.js";

/** Escape a string for safe use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Vowel-letter words that take "a" (consonant sound): "a university". */
const A_BEFORE_VOWEL_LETTER = new Set([
  "university", "universal", "unique", "unicorn", "unit", "union", "united",
  "user", "useful", "used", "usable", "usage", "european", "euro", "one",
  "once", "ubiquitous", "utopia", "ufo", "url", "ui", "ux",
]);

/** Consonant-letter words that take "an" (silent h / vowel sound): "an hour". */
const AN_BEFORE_CONSONANT_LETTER = new Set([
  "hour", "honest", "honestly", "honor", "honour", "honorable", "heir", "heirloom",
]);

/** Choose the correct indefinite article ("a"/"an") for the following word. */
function correctArticle(nextWord: string): "a" | "an" {
  const w = nextWord.toLowerCase();
  if (A_BEFORE_VOWEL_LETTER.has(w)) return "a";
  if (AN_BEFORE_CONSONANT_LETTER.has(w)) return "an";
  return /^[aeiou]/.test(w) ? "an" : "a";
}

/** Build a single recorded change, or return nothing when count is zero. */
function change(rule: string, description: string, count: number): AppliedChange[] {
  return count > 0 ? [{ rule, description, count }] : [];
}

/**
 * Collapse runs of whitespace, trim trailing spaces on each line, and limit
 * blank-line runs to a single blank line. Always safe (lossless).
 */
export const collapseWhitespace: Rule = {
  id: "collapse-whitespace",
  minLevel: "light",
  apply(input): RuleOutput {
    let count = 0;
    let text = input
      // tabs/spaces runs → single space (but preserve newlines)
      .replace(/[^\S\n]+/g, (m) => {
        if (m.length > 1) count++;
        return " ";
      })
      // trailing whitespace per line
      .replace(/[^\S\n]+\n/g, () => {
        count++;
        return "\n";
      })
      // 3+ newlines → 2
      .replace(/\n{3,}/g, () => {
        count++;
        return "\n\n";
      })
      .trim();

    return { text, changes: change("collapse-whitespace", "Normalized whitespace and blank lines", count) };
  },
};

/** Replace wordy phrases with concise equivalents. */
export const replaceWordyPhrases: Rule = {
  id: "replace-wordy-phrases",
  minLevel: "balanced",
  apply(input): RuleOutput {
    let text = input;
    const changes: AppliedChange[] = [];

    for (const [phrase, replacement] of WORDY_PHRASES) {
      const re = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi");
      let count = 0;
      text = text.replace(re, () => {
        count++;
        return replacement;
      });
      if (count > 0) {
        const label = replacement === "" ? `Removed "${phrase}"` : `Replaced "${phrase}" → "${replacement}"`;
        changes.push({ rule: "replace-wordy-phrases", description: label, count });
      }
    }

    // Wordy-phrase removal can leave doubled spaces / orphaned leading spaces.
    text = text.replace(/[^\S\n]{2,}/g, " ").replace(/(^|\n)[^\S\n]+/g, "$1");
    return { text, changes };
  },
};

/** Strip filler openers like "I was wondering if you could ...". */
export const stripFillerOpeners: Rule = {
  id: "strip-filler-openers",
  minLevel: "balanced",
  apply(input): RuleOutput {
    let count = 0;
    // Process line-by-line so each instruction line is cleaned independently.
    const text = input
      .split("\n")
      .map((line) => {
        const trimmedStart = line.replace(/^[\s>*-]*/, (m) => m); // keep list markers
        for (const opener of FILLER_OPENERS) {
          const re = new RegExp(`^(\\s*[>*-]?\\s*)${escapeRegExp(opener)}\\s+`, "i");
          if (re.test(trimmedStart)) {
            count++;
            return trimmedStart.replace(re, (_full, prefix: string) => prefix);
          }
        }
        return line;
      })
      .join("\n");

    return { text, changes: change("strip-filler-openers", "Removed filler openers", count) };
  },
};

/** Remove pure-courtesy politeness particles. */
export const stripPoliteness: Rule = {
  id: "strip-politeness",
  minLevel: "balanced",
  apply(input): RuleOutput {
    let text = input;
    let count = 0;
    for (const word of POLITENESS) {
      const re = new RegExp(`\\b${escapeRegExp(word)}\\b[,.!]?`, "gi");
      text = text.replace(re, () => {
        count++;
        return "";
      });
    }
    text = text.replace(/[^\S\n]{2,}/g, " ").replace(/(^|\n)[^\S\n]+/g, "$1");
    return { text, changes: change("strip-politeness", "Removed courtesy phrases", count) };
  },
};

/** Remove hedges and intensifiers (aggressive only). */
export const stripHedges: Rule = {
  id: "strip-hedges",
  minLevel: "aggressive",
  apply(input): RuleOutput {
    let text = input;
    let count = 0;
    for (const word of HEDGES_AND_INTENSIFIERS) {
      const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
      text = text.replace(re, () => {
        count++;
        return "";
      });
    }
    text = text.replace(/[^\S\n]{2,}/g, " ").replace(/(^|\n)[^\S\n]+/g, "$1");
    return { text, changes: change("strip-hedges", "Removed hedges and intensifiers", count) };
  },
};

/**
 * Remove consecutive duplicate sentences/lines (aggressive). Users frequently
 * paste the same instruction twice; collapsing it is a clean token win.
 */
export const dedupeLines: Rule = {
  id: "dedupe-lines",
  minLevel: "aggressive",
  apply(input): RuleOutput {
    const lines = input.split("\n");
    const out: string[] = [];
    let count = 0;
    let prevNormalized: string | null = null;

    for (const line of lines) {
      const normalized = line.trim().toLowerCase();
      if (normalized.length > 0 && normalized === prevNormalized) {
        count++;
        continue;
      }
      out.push(line);
      if (normalized.length > 0) prevNormalized = normalized;
    }

    return { text: out.join("\n"), changes: change("dedupe-lines", "Removed duplicate lines", count) };
  },
};

/** Final tidy pass: fix punctuation spacing and capitalize sentence starts. */
export const tidyPunctuation: Rule = {
  id: "tidy-punctuation",
  minLevel: "light",
  apply(input): RuleOutput {
    let count = 0;
    let text = input
      // space before punctuation → none
      .replace(/\s+([,.;:!?])/g, (_m, p: string) => {
        count++;
        return p;
      })
      // collapse repeated commas left by removals
      .replace(/,\s*,+/g, () => {
        count++;
        return ",";
      })
      // leading comma/space on a line
      .replace(/(^|\n)\s*,\s*/g, "$1");

    text = text.replace(/[^\S\n]{2,}/g, " ").trim();
    return { text, changes: change("tidy-punctuation", "Tidied punctuation", count) };
  },
};

/**
 * Grammar & English cleanup (always on).
 *
 * Fixes the things that make a quickly-typed or non-native-English prompt read
 * poorly: missing apostrophes/contractions, common misspellings, a lone "i",
 * sentence capitalization, spacing after punctuation, and a missing full stop.
 * This is what makes the default "Optimize" always improve the prompt, even
 * when there is nothing to compress.
 */
export const tidyGrammar: Rule = {
  id: "tidy-grammar",
  minLevel: "light",
  apply(input): RuleOutput {
    const before = input;
    let text = input;

    // 1. Informal spellings / missing apostrophes / typos → standard English.
    for (const [wrong, right] of CONTRACTIONS) {
      text = text.replace(new RegExp(`\\b${escapeRegExp(wrong)}\\b`, "gi"), right);
    }

    // 2. A standalone lowercase "i" → "I".
    text = text.replace(/\bi\b/g, "I");

    // 3. Fix the indefinite article ("a apple" → "an apple", "an book" → "a book").
    text = text.replace(/\b(a|an)\s+([A-Za-z]+)/g, (full, article: string, word: string) => {
      const correct = correctArticle(word);
      if (correct === article.toLowerCase()) return full;
      const isCapitalized = article.charAt(0) === article.charAt(0).toUpperCase();
      const cased = isCapitalized ? correct.charAt(0).toUpperCase() + correct.slice(1) : correct;
      return `${cased} ${word}`;
    });

    // 4. Ensure a single space after sentence punctuation (not inside numbers).
    text = text.replace(/([,;:])(?=\S)/g, "$1 ");
    text = text.replace(/([.!?])(?=[A-Za-z])/g, "$1 ");

    // 5. Capitalize the first letter of each sentence.
    text = text.replace(/(^|[.!?]\s+)([a-z])/g, (_m, pre: string, ch: string) => pre + ch.toUpperCase());

    // 6. Add a terminal period if the prompt ends mid-sentence (letter/digit).
    if (/[A-Za-z0-9]$/.test(text.trim())) {
      text = `${text.trimEnd()}.`;
    }

    // Collapse any double spaces the fixes introduced.
    text = text.replace(/[^\S\n]{2,}/g, " ").trim();

    return { text, changes: change("tidy-grammar", "Fixed grammar, spelling, and capitalization", text === before ? 0 : 1) };
  },
};

/** Ordered rule pipeline. Order matters: cleanups run last. */
export const ALL_RULES: ReadonlyArray<Rule> = [
  collapseWhitespace,
  replaceWordyPhrases,
  stripFillerOpeners,
  stripPoliteness,
  stripHedges,
  dedupeLines,
  tidyPunctuation,
  tidyGrammar,
];
