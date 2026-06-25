/**
 * Word/phrase dictionaries used by the optimization rules.
 *
 * Everything here is meaning-preserving for the overwhelming majority of
 * prompts. Replacements are intentionally conservative: when in doubt we leave
 * text untouched rather than risk changing intent.
 */

/** Wordy phrase → concise replacement. Matched case-insensitively, word-bounded. */
export const WORDY_PHRASES: ReadonlyArray<readonly [pattern: string, replacement: string]> = [
  ["in order to", "to"],
  ["in order for", "for"],
  ["due to the fact that", "because"],
  ["owing to the fact that", "because"],
  ["for the reason that", "because"],
  ["in the event that", "if"],
  ["in the case that", "if"],
  ["on the off chance that", "if"],
  ["at this point in time", "now"],
  ["at the present time", "now"],
  ["in the near future", "soon"],
  ["a large number of", "many"],
  ["a great deal of", "much"],
  ["the majority of", "most"],
  ["a sufficient amount of", "enough"],
  ["with regard to", "about"],
  ["with reference to", "about"],
  ["in relation to", "about"],
  ["in terms of", "for"],
  ["in the context of", "for"],
  ["as a matter of fact", "in fact"],
  ["for the purpose of", "to"],
  ["with the exception of", "except"],
  ["in spite of the fact that", "although"],
  ["despite the fact that", "although"],
  ["in the absence of", "without"],
  ["has the ability to", "can"],
  ["have the ability to", "can"],
  ["is able to", "can"],
  ["are able to", "can"],
  ["it is important to note that", ""],
  ["it should be noted that", ""],
  ["please note that", ""],
  ["take into consideration", "consider"],
  ["take into account", "consider"],
  ["make a decision", "decide"],
  ["come to a conclusion", "conclude"],
  ["give an explanation", "explain"],
  ["provide a description of", "describe"],
  ["a number of", "several"],
  ["each and every", "every"],
  ["end result", "result"],
  ["final outcome", "outcome"],
  ["close proximity", "near"],
  ["basic fundamentals", "fundamentals"],
  ["completely eliminate", "eliminate"],
];

/**
 * Filler openers that add no instruction and can be dropped from the start of
 * a sentence. Removed at `balanced`+ aggressiveness.
 */
export const FILLER_OPENERS: ReadonlyArray<string> = [
  "i was wondering if you could",
  "i was wondering if you can",
  "i would like you to",
  "i'd like you to",
  "i want you to",
  "i need you to",
  "i would like to ask you to",
  "can you please",
  "could you please",
  "could you kindly",
  "would you please",
  "would you kindly",
  "i would really appreciate it if you could",
  "if it's not too much trouble",
  "if you don't mind",
  "please go ahead and",
  "i'm hoping you can",
  "i am hoping you can",
];

/**
 * Hedges and intensifiers that rarely change instruction meaning. Removed only
 * at `aggressive` aggressiveness because in rare cases nuance matters.
 */
export const HEDGES_AND_INTENSIFIERS: ReadonlyArray<string> = [
  "just",
  "really",
  "very",
  "quite",
  "actually",
  "basically",
  "literally",
  "simply",
  "kind of",
  "sort of",
  "a bit",
  "a little",
  "somewhat",
  "i think",
  "i guess",
  "i believe",
  "maybe",
  "perhaps",
  "you know",
];

/** Polite particles that are pure courtesy and carry no instruction. */
export const POLITENESS: ReadonlyArray<string> = [
  "please",
  "kindly",
  "thanks in advance",
  "thank you in advance",
  "thank you so much",
  "thanks so much",
];
