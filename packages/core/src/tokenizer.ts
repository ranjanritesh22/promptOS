/**
 * Lightweight token estimation.
 *
 * Real BPE tokenizers (cl100k_base / Claude's tokenizer) require shipping a
 * multi-megabyte vocabulary, which is overkill for a browser extension whose
 * job is to show users a *relative* before/after saving. Instead we use a
 * blended heuristic that tracks real tokenizers closely for English prose:
 *
 *   - ~4 characters per token on average, and
 *   - ~0.75 words per token (i.e. words * 1.333),
 *
 * We take the max of the two so that whitespace-heavy or punctuation-heavy
 * text is not under-counted. Results are clearly labelled "estimated" in the
 * UI so the heuristic never masquerades as exact.
 */

const CHARS_PER_TOKEN = 4;
const TOKENS_PER_WORD = 1.333;

/** Estimate the number of tokens in a piece of text. */
export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;

  const charEstimate = trimmed.length / CHARS_PER_TOKEN;

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordEstimate = words.length * TOKENS_PER_WORD;

  return Math.max(1, Math.round(Math.max(charEstimate, wordEstimate)));
}

/** Build a {@link import("./types").TokenStats} object for a before/after pair. */
export function buildTokenStats(original: string, optimized: string) {
  const originalTokens = estimateTokens(original);
  const optimizedTokens = estimateTokens(optimized);
  const saved = originalTokens - optimizedTokens;
  const savedPercent =
    originalTokens === 0
      ? 0
      : Math.round((saved / originalTokens) * 1000) / 10;

  return { originalTokens, optimizedTokens, saved, savedPercent };
}
