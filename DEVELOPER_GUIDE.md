# PromptOS — Developer Guide

> A deep, beginner-friendly walkthrough of how PromptOS works **under the hood**,
> especially the **English engine** that cleans up prompts with no AI.
>
> If you are new to extensions: read [Part 1](#part-1--the-big-picture) and
> [Part 4](#part-4--the-english-engine-deep-dive) first. Everything is plain
> TypeScript + regex. There is no machine learning, no API, no magic.

---

## Table of contents

1. [The big picture (mental model)](#part-1--the-big-picture)
2. [Repository layout & why it's split this way](#part-2--repository-layout)
3. [App flow — what happens when you click Optimize](#part-3--app-flow)
4. [The English engine, deep dive](#part-4--the-english-engine-deep-dive)
5. [The Enhance engine (intent + templates)](#part-5--the-enhance-engine)
6. [Data shapes (types)](#part-6--data-shapes)
7. [The extension surfaces](#part-7--the-extension-surfaces)
8. [How-to recipes (add/fix things)](#part-8--how-to-recipes)
9. [Testing](#part-9--testing)
10. [Debugging a wrong result](#part-10--debugging-a-wrong-result)

---

## Part 1 — The big picture

PromptOS takes a messy prompt a human typed and turns it into a better one. It
has **two modes**:

| Mode | Setting | What it does | File that drives it |
|---|---|---|---|
| **Optimize (Clean)** | `enhance: false` (default) | Fix grammar, spelling, wordiness, capitalization. *Same meaning, better English.* | [rules.ts](packages/core/src/rules.ts) |
| **Enhance** | `enhance: true` | Detect what you're asking for (coding, writing, health…) and rewrite into a full structured prompt. | [intents.ts](packages/core/src/intents.ts) |

Both modes are **pure functions**: text goes in, text comes out. No state, no
network. The single entry point everything calls is:

```ts
import { optimize } from "@promptos/core";

const result = optimize("pls fix my code it dont work", { enhance: false });
// result.optimized → "Please fix my code it don't work."
// result.stats     → token counts before/after
// result.changes   → list of what was changed
// result.intent    → detected category (always reported)
```

> **What the English engine does and doesn't do.** It fixes *lexical* things —
> spelling, missing apostrophes (`dont→don't`), articles (`a apple→an apple`),
> capitalization, punctuation, wordiness. It does **not** do full *grammatical*
> parsing, so it won't fix subject–verb agreement (`it don't → it doesn't`). That
> would need a real grammar parser; PromptOS stays lightweight on purpose. If you
> want to add such fixes, they belong in a new dictionary + a focused rule (see
> [Part 8](#part-8--how-to-recipes)).

> The whole engine lives in **`packages/core/`**. The extension and the website
> are just *user interfaces* that call `optimize()`. Learn the core and you
> understand 80% of PromptOS.

---

## Part 2 — Repository layout

It's an **npm workspaces monorepo** (one repo, multiple packages):

```
promptOS/
├── packages/core/        ← THE ENGINE (shared brain). Pure TS, no dependencies.
├── apps/extension/       ← Chrome extension (UI that calls the engine)
└── apps/web/             ← Next.js website (another UI that calls the engine)
```

**Why split the engine out?** So the exact same `optimize()` runs in the Chrome
extension *and* the website. Fix a bug once in `packages/core`, both UIs get it.
This is the most important architectural rule: **logic lives in core; apps only
do UI.**

### Inside `packages/core/src/`

| File | Role | One-line summary |
|---|---|---|
| [types.ts](packages/core/src/types.ts) | Contracts | Every TypeScript type/shape used everywhere. |
| [dictionaries.ts](packages/core/src/dictionaries.ts) | Data | The word lists (typos, wordy phrases, fillers…). |
| [rules.ts](packages/core/src/rules.ts) | English engine | 8 small text-transform functions. |
| [tokenizer.ts](packages/core/src/tokenizer.ts) | Counting | Estimates how many tokens a string costs. |
| [intents.ts](packages/core/src/intents.ts) | Enhance engine | Detects intent + builds template prompts. |
| [optimizer.ts](packages/core/src/optimizer.ts) | Orchestrator | Runs the pipeline and returns the result. |
| [index.ts](packages/core/src/index.ts) | Public API | Re-exports everything the apps may import. |
| [optimizer.test.ts](packages/core/src/optimizer.test.ts) / [intents.test.ts](packages/core/src/intents.test.ts) | Tests | Node's built-in test runner. |

---

## Part 3 — App flow

### Flow A: the inline ✦ Optimize button (in a chat box)

```
User types in ChatGPT/Claude composer
        │
        ▼
content script (content/index.ts) is already injected on the page
        │  watches the DOM, shows the ✦ button near the composer
        ▼
User clicks ✦  ──► runOptimize()
        │
        ├─ readInput(el)           ← read original text (platforms.ts)
        ├─ optimize(text, {...})    ← THE ENGINE (packages/core)
        ├─ writeInput(el, result)  ← apply immediately — no modal
        └─ showToast(result, { onUndo: () => writeInput(el, original) })
                │
                └─ small slide-up bar at bottom: "✦ PromptOS · Fixed grammar · −4 tokens  [Undo]"
                   auto-dismisses in 5 s; Escape or Undo click restores original text
```

Key files: [content/index.ts](apps/extension/src/content/index.ts),
[content/preview.ts](apps/extension/src/content/preview.ts),
[shared/platforms.ts](apps/extension/src/shared/platforms.ts).

> **Why no preview modal?** The old approach required three clicks (Optimize → read result → Apply to chat) and blocked the whole page. The new approach applies instantly and lets the user undo if they don't like the result — the same pattern used by Gmail's "Send undo" and Notion's slash commands.

### Flow B: the toolbar popup

```
User clicks the PromptOS icon → popup.html opens
        │
        ▼
popup/index.ts: user pastes text → clicks Optimize → optimize(text) → render
        │
        ├─ "From page" → message content script → reads the active chat text
        └─ "Apply to chat" → message content script → writes text back
```

Key file: [popup/index.ts](apps/extension/src/popup/index.ts).

### Settings flow

`enhance` and `showInlineButton` are stored in `chrome.storage.sync` (syncs
across the user's Chrome). See
[shared/settings.ts](apps/extension/src/shared/settings.ts). When the popup
changes a setting, `onSettingsChanged` fires in any open content script so the
button updates live — no page reload needed.

---

## Part 4 — The English engine deep dive

This is the part you asked about: **how PromptOS fixes English with no AI.**

### 4.1 The `Rule` contract

Every transformation is a **Rule** — a tiny object with a pure `apply` function
(defined in [types.ts](packages/core/src/types.ts)):

```ts
interface Rule {
  id: string;                 // stable id, e.g. "tidy-grammar"
  minLevel: Aggressiveness;   // lowest strength at which this rule runs
  apply: (input: string) => RuleOutput;   // text in → text + changes out
}

interface RuleOutput {
  text: string;               // the transformed text
  changes: AppliedChange[];   // what was changed (for the "changes" list)
}
```

A rule **never** mutates anything outside itself. It receives a string and
returns a new string. That makes each rule independently testable and impossible
to break the others.

### 4.2 The pipeline (the orchestrator)

[optimizer.ts](packages/core/src/optimizer.ts) runs every rule **in order**, but
only if the rule's `minLevel` is allowed at the chosen strength:

```ts
for (const rule of ALL_RULES) {
  if (!ruleEnabled(rule.minLevel, aggressiveness)) continue;  // skip if too strong
  const result = rule.apply(text);   // run it
  text = result.text;                // feed output into the next rule
  changes.push(...result.changes);   // remember what it did
}
```

`ruleEnabled` just compares numbers via `LEVEL_RANK` (`light:0`, `balanced:1`,
`aggressive:2`). A rule runs when `chosen >= rule.minLevel`.

> **Default strength is `balanced`.** The extension no longer exposes a strength
> dropdown — it always uses balanced, which runs everything except the two
> aggressive-only rules (`strip-hedges`, `dedupe-lines`).

### 4.3 The order of rules (and why order matters)

From the bottom of [rules.ts](packages/core/src/rules.ts):

```ts
export const ALL_RULES = [
  collapseWhitespace,    // 1. light      — normalize spaces/blank lines
  replaceWordyPhrases,   // 2. balanced   — "due to the fact that" → "because"
  stripFillerOpeners,    // 3. balanced   — drop "i want you to ..."
  stripPoliteness,       // 4. balanced   — drop "please", "kindly"
  stripHedges,           // 5. aggressive — drop "just", "really", "very"
  dedupeLines,           // 6. aggressive — drop repeated lines
  tidyPunctuation,       // 7. light      — fix spacing before punctuation
  tidyGrammar,           // 8. light      — THE GRAMMAR/ENGLISH FIXER (always last)
];
```

**Why this order?**
- Removals run **before** cleanups, because deleting words leaves messy double
  spaces and stray commas behind.
- `tidyGrammar` runs **last** so it can capitalize and add a final period *after*
  filler removal has changed where the sentence starts. (If grammar ran first,
  filler removal could uncapitalize the new first word.)

### 4.4 Rule-by-rule

Each rule lives in [rules.ts](packages/core/src/rules.ts). Two small helpers are
shared at the top:
- `escapeRegExp(str)` — makes a word safe to drop inside a `new RegExp(...)` (so
  a phrase containing `.` or `(` doesn't break the pattern).
- `change(rule, description, count)` — builds the change record, or returns `[]`
  when `count` is 0 (so unused rules don't clutter the changes list).

#### 1. `collapseWhitespace` (light)
Collapses runs of spaces/tabs to one space, strips trailing spaces per line, and
caps blank-line runs at one blank line. Lossless — never changes words.

#### 2. `replaceWordyPhrases` (balanced)
Loops over `WORDY_PHRASES` (107 pairs). For each `[phrase, replacement]` it builds
a word-bounded, case-insensitive regex and replaces every hit:

```ts
const re = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi");
text = text.replace(re, () => { count++; return replacement; });
```

`\b` is a **word boundary** so `"in order to"` matches as whole words, not inside
another word. After replacing it tidies any double spaces the removal left.

#### 3. `stripFillerOpeners` (balanced)
Removes phrases people glue to the *start* of an instruction (`"i want you to"`,
`"could you please"`). It works **line by line** and only matches at the start
(`^`), preserving list markers like `-` or `>`. So `"i want you to build X"` →
`"build X"`.

#### 4. `stripPoliteness` (balanced)
Deletes pure-courtesy words from `POLITENESS` (`please`, `kindly`, `thanks in
advance`…) anywhere in the text, then cleans up the leftover spaces/commas.

#### 5. `stripHedges` (aggressive only)
Removes filler intensifiers from `HEDGES_AND_INTENSIFIERS` (`just`, `really`,
`very`, `basically`…). Aggressive-only because rarely the nuance matters.

#### 6. `dedupeLines` (aggressive only)
Drops a line if it's identical (ignoring case/space) to the line right before it.
Catches accidental copy-paste duplicates.

#### 7. `tidyPunctuation` (light)
Fixes space-before-punctuation (`"hello ,world"` → `"hello, world"`), collapses
doubled commas left by removals, and strips a leading comma on a line.

#### 8. `tidyGrammar` (light) — **the English fixer**

This is the rule that makes the default Optimize *always* improve the text, even
when there's nothing to compress. It runs six steps in order on the string:

```ts
// 1. Informal spelling / missing apostrophes / typos → standard English
for (const [wrong, right] of CONTRACTIONS)
  text = text.replace(new RegExp(`\\b${escapeRegExp(wrong)}\\b`, "gi"), right);
//   "dont" → "don't",  "becuase" → "because",  "wanna" → "want to",  "u" → "you"

// 2. A standalone lowercase "i" → "I"
text = text.replace(/\bi\b/g, "I");
//   "i think i can" → "I think I can"

// 3. Fix the indefinite article a/an based on the NEXT word
text = text.replace(/\b(a|an)\s+([A-Za-z]+)/g, (full, article, word) => {
  const correct = correctArticle(word);        // "a" or "an"
  ... keep capitalization, only replace if wrong
});
//   "a apple" → "an apple",  "an book" → "a book"

// 4. Ensure ONE space after , ; : and after . ! ? when a letter follows
text = text.replace(/([,;:])(?=\S)/g, "$1 ");
text = text.replace(/([.!?])(?=[A-Za-z])/g, "$1 ");
//   "hello,world" → "hello, world"

// 5. Capitalize the first letter of every sentence
text = text.replace(/(^|[.!?]\s+)([a-z])/g, (_m, pre, ch) => pre + ch.toUpperCase());
//   "build a app. it must be fast" → "Build a app. It must be fast"

// 6. Add a terminal period if the prompt ends mid-sentence
if (/[A-Za-z0-9]$/.test(text.trim())) text = text.trimEnd() + ".";
//   "build a todo app" → "build a todo app."
```

**The a/an helper (`correctArticle`)** is the trickiest part because English is
irregular. The naive rule "use *an* before a vowel letter" is wrong for
`"a university"` (sounds like *yoo*) and `"an hour"` (silent *h*). So there are
two exception sets at the top of [rules.ts](packages/core/src/rules.ts):

```ts
const A_BEFORE_VOWEL_LETTER = new Set(["university","unique","user","european","one", ...]);
const AN_BEFORE_CONSONANT_LETTER = new Set(["hour","honest","honor","heir", ...]);

function correctArticle(nextWord) {
  const w = nextWord.toLowerCase();
  if (A_BEFORE_VOWEL_LETTER.has(w)) return "a";        // "a university"
  if (AN_BEFORE_CONSONANT_LETTER.has(w)) return "an";  // "an hour"
  return /^[aeiou]/.test(w) ? "an" : "a";              // default by first letter
}
```

> **Why `tidyGrammar` reports only one change.** Unlike `replaceWordyPhrases`
> (which counts every hit), the grammar rule records a single "Fixed grammar,
> spelling, and capitalization" entry if *anything* changed. It compares the
> final string to the input: `text === before ? 0 : 1`.

### 4.5 The dictionaries (the "knowledge")

All word data lives in [dictionaries.ts](packages/core/src/dictionaries.ts).
**To teach PromptOS more English, you edit these lists — no code changes needed.**

| Export | Count | Shape | Used by |
|---|---|---|---|
| `WORDY_PHRASES` | 107 | `[phrase, shorterReplacement]` | `replaceWordyPhrases` |
| `CONTRACTIONS` | 121 | `[wrong, correct]` | `tidyGrammar` (step 1) |
| `FILLER_OPENERS` | 33 | `string` | `stripFillerOpeners` |
| `HEDGES_AND_INTENSIFIERS` | 19 | `string` | `stripHedges` |
| `POLITENESS` | 6 | `string` | `stripPoliteness` |

`CONTRACTIONS` covers three jobs: missing apostrophes (`dont→don't`), informal
shorthand (`u→you`, `thru→through`, `wanna→want to`), and frequent misspellings
(`recieve→receive`, `definately→definitely`).

> **Safety rule for `CONTRACTIONS`:** only add entries that are *unambiguous*.
> We deliberately do **not** map `id`, `ill`, `its`, `lets`, `were` because those
> have valid normal meanings (an `id` field, feeling `ill`, possessive `its`).
> Auto-"fixing" them would corrupt correct prompts.

### 4.6 The tokenizer

[tokenizer.ts](packages/core/src/tokenizer.ts) estimates token cost so the UI can
show "12 → 8 tokens (33%)". Real tokenizers need a multi-MB vocabulary; instead
PromptOS blends two cheap heuristics and takes the **max**:

```ts
charEstimate = text.length / 4;          // ~4 chars per token
wordEstimate = wordCount * 1.333;        // ~0.75 words per token
tokens = Math.max(1, round(max(charEstimate, wordEstimate)));
```

It's labelled "estimated" in the UI — close enough for before/after comparison,
not exact billing.

---

## Part 5 — The Enhance engine

When `enhance: true`, after the cleanup rules run, the optimizer replaces the
prompt with a **structured template**. This lives in
[intents.ts](packages/core/src/intents.ts) and has three jobs.

### 5.1 `detectIntent(text)` — what is the user asking for?

There are 9 categories: `coding`, `debugging`, `planning`, `writing`,
`learning`, `health`, `business`, `data`, and `general` (fallback).

Each category has a list of **signal words**. Scoring works like this:

```ts
function scoreIntent(def, lower, goalStart) {
  let score = 0;
  for (const signal of def.signals) {
    if (wordBoundedMatch(signal, lower)) {
      score += signal.includes(" ") ? 2 : 1;     // multi-word phrases score higher
      if (goalStart.startsWith(signal)) score += 1; // leading verb bonus
    }
  }
  return score;
}
```

Two ideas make detection accurate:
1. **Multi-word signals score 2**, single words score 1 — because `"meal plan"`
   is a stronger signal than `"plan"`.
2. **Leading-verb bonus (+1)** — the verb a request *starts* with is the strongest
   clue. `"explain how promises work in javascript"` → *Learning*, even though it
   mentions JavaScript, because it opens with "explain".

The highest-scoring category wins. If nothing scores, it returns `general` with
`confidence: 0`. Confidence is `min(1, score / 3)` so 3+ hits reads as 100%.

### 5.2 `extractGoal(text)` — strip the framing

People wrap the same request a dozen ways. `extractGoal` removes leading framing
(`LEAD_FRAMING` list: `"i want to"`, `"can you please"`, `"make me a"`…) and
trailing courtesy (`"thanks in advance"`), so all of these collapse to one goal:

```
"i want to build a todo app"          ┐
"can you please build a todo app"     ├─► "build a todo app"
"make me a todo app, thanks!"         ┘
```

It loops (`while changed`) so stacked framing (`"can you help me build…"`) is
peeled layer by layer.

### 5.3 `buildIntentPrompt(text, intent)` — the anatomy of a good prompt

Each category has a `template(goal)` function that produces a prompt following a
consistent **anatomy**: a *role*, the *task*, and concrete *deliverables*. For
example the coding template:

```
Act as a senior software engineer.

Task: Build a todo app.

Deliver:
- Complete, runnable, idiomatic code.
- A one-line note on the language/framework and any assumptions.
- Brief instructions to run or test it.

Keep it production-quality. Ask before guessing missing requirements.
```

This is the "good prompt structure" any chatbot responds well to: role → task →
explicit outputs → constraints. The `health` template additionally appends a
medical-disclaimer line.

> Enhance **adds** tokens on purpose. It trades brevity for clarity. The token
> badge will show a positive delta — that's expected, not a bug.

---

## Part 6 — Data shapes

From [types.ts](packages/core/src/types.ts) — the contracts every file agrees on:

```ts
type Aggressiveness = "light" | "balanced" | "aggressive";

type IntentCategory =
  "coding" | "debugging" | "planning" | "writing" |
  "learning" | "health" | "business" | "data" | "general";

interface OptimizeOptions {
  aggressiveness?: Aggressiveness;  // default "balanced"; internal, not in the UI
  enhance?: boolean;                // false = English cleanup, true = structured rewrite
  platform?: Platform;              // reserved for future per-site tuning
}

interface OptimizeResult {
  original: string;
  optimized: string;
  stats: TokenStats;            // { originalTokens, optimizedTokens, saved, savedPercent }
  changes: AppliedChange[];     // [{ rule, description, count }]
  intent: IntentMatch;          // { category, label, confidence } — ALWAYS present
}
```

If you change any of these, TypeScript will point you at every spot that needs
updating. That's the safety net.

---

## Part 7 — The extension surfaces

The extension is built by [build.mjs](apps/extension/build.mjs) (esbuild) which
bundles four entry points into `dist/` and copies the static `public/` files.

| Surface | Entry | What it owns |
|---|---|---|
| **Content script** | [content/index.ts](apps/extension/src/content/index.ts) | Injects the ✦ button into AI sites, runs optimize on click, applies text immediately, shows toast. |
| **Toast notification** | [content/preview.ts](apps/extension/src/content/preview.ts) | Small slide-up bar at the bottom of the page: shows top change + token saving + Undo button. Auto-dismisses after 5 s. |
| **Popup** | [popup/index.ts](apps/extension/src/popup/index.ts) + `public/popup.html` | The toolbar mini-app: paste → Optimize → Copy/Apply, plus the Enhance toggle. |
| **Options** | [options/index.ts](apps/extension/src/options/index.ts) + `public/options.html` | Full settings page. |
| **Background** | [background/index.ts](apps/extension/src/background/index.ts) | MV3 service worker: seeds default settings, opens welcome page on install. |
| **Shared settings** | [shared/settings.ts](apps/extension/src/shared/settings.ts) | `Settings` type (`enhance`, `showInlineButton`), load/save via `chrome.storage.sync`, change subscription. |
| **Platforms** | [shared/platforms.ts](apps/extension/src/shared/platforms.ts) | Per-site adapters: how to find and read/write each composer. |

### How text gets written back into a chat box (the tricky bit)

Sites like ChatGPT (React) and Claude (ProseMirror) ignore a plain
`element.value = "..."`. So `writeInput` in
[platforms.ts](apps/extension/src/shared/platforms.ts) does it the way the site's
framework expects:
- **`<textarea>`** → call the *native* value setter, then dispatch a real `input`
  event so React notices.
- **contenteditable `<div>`** → select all, then `document.execCommand("insertText", …)`
  so the editor's internal model updates; falls back to setting `textContent` +
  dispatching an `InputEvent`.

This is the #1 source of "Apply doesn't work on site X" bugs — if a new site uses
a different editor, add an adapter and/or adjust `writeInput`.

---

## Part 8 — How-to recipes

### Add a new misspelling or contraction fix
1. Open [dictionaries.ts](packages/core/src/dictionaries.ts), find `CONTRACTIONS`.
2. Add `["recieved", "received"],` (lowercase the "wrong" side — matching is
   case-insensitive).
3. **Make sure it's unambiguous** (see the safety rule in 4.5).
4. Add a line in [optimizer.test.ts](packages/core/src/optimizer.test.ts) asserting
   it, run `npm test`.

### Add a wordy phrase
Add `["at the end of the day", "ultimately"],` to `WORDY_PHRASES`. Put the
**longest** phrases earlier if one phrase is a prefix of another.

### Add an a/an exception (a wrong article fix)
If PromptOS turns `"a FAQ"` into `"an FAQ"` wrongly (or similar), add the word to
`A_BEFORE_VOWEL_LETTER` or `AN_BEFORE_CONSONANT_LETTER` at the top of
[rules.ts](packages/core/src/rules.ts).

### Add a whole new optimization rule
1. Write a `Rule` object in [rules.ts](packages/core/src/rules.ts) with an `id`,
   a `minLevel`, and a pure `apply`.
2. Add it to the `ALL_RULES` array in the right position (removals before
   cleanups; grammar stays last).
3. Add a test.

### Add a new intent category (Enhance)
1. In [intents.ts](packages/core/src/intents.ts), add the literal to
   `IntentCategory` in [types.ts](packages/core/src/types.ts).
2. Add an object to the `INTENTS` array: `category`, `label`, `signals` (keywords),
   and a `template(goal)` returning the structured prompt.
3. Order matters only for ties — put more specific categories earlier.
4. Add a `detectIntent` test in [intents.test.ts](packages/core/src/intents.test.ts).

### Support a new AI website
Add an adapter to `ADAPTERS` in
[platforms.ts](apps/extension/src/shared/platforms.ts) with a `matches(host)` and
`inputSelectors` (CSS selectors tried in order). Rebuild, reload, test Apply.

---

## Part 9 — Testing

```bash
npm test            # run all core engine tests (Node's built-in runner)
npm run typecheck   # type-check every workspace (catches shape mistakes)
npm run build:extension   # bundle the extension into apps/extension/dist
```

Tests live next to the code: [optimizer.test.ts](packages/core/src/optimizer.test.ts)
(rules, grammar, tokenizer) and [intents.test.ts](packages/core/src/intents.test.ts)
(detection, goal extraction, templates). There is also a manual prompt checklist
in [TEST_PROMPTS.md](TEST_PROMPTS.md) for clicking through the UI.

A test is just:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { optimize } from "./optimizer.js";

test("grammar fixes apostrophes", () => {
  const r = optimize("it dont work", { aggressiveness: "light" });
  assert.match(r.optimized, /don't/);
});
```

> Note the `.js` import even though the file is `.ts` — that's required by the
> project's ESM/`NodeNext` setup; the runner resolves it to the `.ts` source.

---

## Part 10 — Debugging a wrong result

PromptOS is fully deterministic, so any wrong output is reproducible. Workflow:

1. **Reproduce in isolation.** Write a 5-line script (or a test) that calls
   `optimize("the bad input")` and logs `result.optimized` and `result.changes`.
   The `changes` array tells you *which rule* fired.

2. **Find the responsible rule.** Each change has a `rule` id matching a rule in
   [rules.ts](packages/core/src/rules.ts). If `"replace-wordy-phrases"` made a bad
   swap, the offending pair is in `WORDY_PHRASES`.

3. **Wrong word "corrected"?** It's almost always a too-aggressive entry in
   `CONTRACTIONS` or `WORDY_PHRASES`. Remove or narrow it (e.g. add a word
   boundary or drop the ambiguous mapping).

4. **Wrong a/an?** Add the word to the right exception set in
   [rules.ts](packages/core/src/rules.ts) (`correctArticle`).

5. **Wrong intent in Enhance?** Log `detectIntent("input")`. Adjust `signals`
   (add/remove keywords) or rely on the leading-verb bonus. Re-run the doc sweep
   in [TEST_PROMPTS.md](TEST_PROMPTS.md) to confirm you didn't regress others.

6. **Apply doesn't write to a site?** That's UI, not engine — debug `writeInput`
   and the site's adapter in
   [platforms.ts](apps/extension/src/shared/platforms.ts), not the core.

7. **Lock the fix in with a test** so it never regresses.

---

### TL;DR for a first-time contributor

- The brain is `packages/core`. To improve English, edit
  [dictionaries.ts](packages/core/src/dictionaries.ts).
- Grammar/spelling/a-an logic is the `tidyGrammar` rule in
  [rules.ts](packages/core/src/rules.ts).
- Enhance (structured prompts) is [intents.ts](packages/core/src/intents.ts).
- Everything is pure functions + regex + word lists. No AI, no network.
- `npm test` after every change; `npm run build:extension` then reload in
  `chrome://extensions` to try it live.
