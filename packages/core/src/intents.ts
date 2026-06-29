/**
 * Intent detection + template-based prompt building.
 *
 * This is the "enhance" half of PromptOS. Where the rule pipeline in
 * {@link ./rules} *compresses* a prompt, the intent engine *upgrades* it: it
 * looks at what a human is actually asking for ("build me a site", "fix this
 * bug", "plan my week", "help me lose weight") and rewrites it into a crisp,
 * well-structured, canonical prompt that gets a far better answer.
 *
 * Everything here is 100% local — pure keyword scoring + fixed templates. No
 * network calls, no AI. The same messy request always maps to the same clean
 * prompt, regardless of how the user phrased it.
 */

import type { IntentCategory, IntentMatch } from "./types.js";

/** A detectable intent: how to recognize it and how to rewrite it. */
interface IntentDef {
  category: IntentCategory;
  label: string;
  /** Keyword/phrase signals. Multi-word phrases score higher (more specific). */
  signals: ReadonlyArray<string>;
  /** Turn the cleaned user goal into a structured, canonical prompt. */
  template: (goal: string) => string;
}

/**
 * Leading request framing that adds no meaning ("i want to", "can you",
 * "help me", ...). Stripped so the goal reads as a clean directive that
 * templates can wrap. Order matters: longer phrases first.
 */
const LEAD_FRAMING: ReadonlyArray<string> = [
  "i was wondering if you could",
  "i would really appreciate it if you could",
  "i would like you to",
  "i would like to",
  "i'd like you to",
  "i'd like to",
  "i was trying to",
  "i am trying to",
  "i'm trying to",
  "i want you to",
  "i need you to",
  "can you help me to",
  "can you help me",
  "could you help me",
  "please help me to",
  "please help me",
  "help me to",
  "help me",
  "can you please",
  "could you please",
  "would you please",
  "can you",
  "could you",
  "would you",
  "i want to",
  "i need to",
  "i want",
  "i need",
  "i wanna",
  "let's",
  "lets",
  "make me a",
  "make me an",
  "make me",
  "build me a",
  "build me an",
  "build me",
  "create me a",
  "create me an",
  "give me a",
  "give me an",
  "give me",
  "show me how to",
  "tell me how to",
  "please",
];

/**
 * Strip leading framing and tidy a raw request into a bare goal clause.
 * e.g. "i want to build a todo app in react" → "build a todo app in react".
 */
export function extractGoal(input: string): string {
  let goal = input.trim().replace(/\s+/g, " ");

  // Strip one or more layers of leading framing.
  let changed = true;
  while (changed) {
    changed = false;
    const lower = goal.toLowerCase();
    for (const frame of LEAD_FRAMING) {
      if (lower.startsWith(frame + " ")) {
        goal = goal.slice(frame.length).trimStart();
        changed = true;
        break;
      }
      if (lower === frame) {
        goal = "";
        changed = true;
        break;
      }
    }
  }

  // Drop a trailing courtesy ("..., thanks", "... thank you").
  goal = goal.replace(/[\s,]*(thanks?( you)?( so much)?( in advance)?|cheers)\s*[.!]?$/i, "");

  // Drop a single trailing period/space; templates re-add punctuation.
  goal = goal.replace(/[.!\s]+$/g, "").trim();

  // Lowercase a leading capital from a stripped fragment so it flows inside a
  // sentence, but leave acronyms / proper-looking tokens alone.
  if (goal && /^[A-Z][a-z]/.test(goal)) {
    goal = goal.charAt(0).toLowerCase() + goal.slice(1);
  }

  return goal;
}

/** Capitalize the first letter (for standalone restatements). */
function cap(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** Goal as a complete sentence: "Build a todo app." */
function asSentence(goal: string, fallback: string): string {
  const g = goal.trim();
  if (!g) return fallback;
  return /[.!?]$/.test(g) ? cap(g) : `${cap(g)}.`;
}

const INTENTS: ReadonlyArray<IntentDef> = [
  {
    category: "debugging",
    label: "Debugging",
    signals: [
      "error",
      "bug",
      "not working",
      "doesn't work",
      "does not work",
      "fix this",
      "fix my",
      "broken",
      "exception",
      "stack trace",
      "traceback",
      "undefined",
      "null pointer",
      "crash",
      "failing",
      "throws",
      "why is",
      "debug",
    ],
    template: (goal) =>
      [
        "Act as a senior software engineer debugging an issue.",
        "",
        `Problem: ${asSentence(goal, "the code below is not behaving as expected.")}`,
        "",
        "Walk through it in this order:",
        "1. The most likely root cause, explained briefly.",
        "2. The corrected code.",
        "3. How to verify the fix.",
        "",
        "If key details are missing (error message, language, expected vs. actual behaviour), ask for them before guessing.",
      ].join("\n"),
  },
  {
    category: "coding",
    label: "Coding",
    signals: [
      "code",
      "function",
      "component",
      "api",
      "endpoint",
      "script",
      "program",
      "class",
      "implement",
      "refactor",
      "app",
      "website",
      "web app",
      "frontend",
      "backend",
      "database",
      "sql",
      "react",
      "python",
      "javascript",
      "typescript",
      "node",
      "css",
      "html",
      "algorithm",
      "regex",
    ],
    template: (goal) =>
      [
        "Act as a senior software engineer.",
        "",
        `Task: ${asSentence(goal, "implement the feature described below.")}`,
        "",
        "Deliver:",
        "- Complete, runnable, idiomatic code.",
        "- A one-line note on the language/framework and any assumptions.",
        "- Brief instructions to run or test it.",
        "",
        "Keep it production-quality. Ask before guessing missing requirements rather than inventing them.",
      ].join("\n"),
  },
  {
    category: "planning",
    label: "Planning",
    signals: [
      "plan",
      "roadmap",
      "strategy",
      "steps",
      "step by step",
      "organize",
      "organise",
      "schedule",
      "timeline",
      "milestones",
      "break down",
      "outline",
      "how should i",
      "approach",
      "architecture",
      "design a system",
      "structure for",
    ],
    template: (goal) =>
      [
        "Act as an experienced project planner and architect.",
        "",
        `Goal: ${asSentence(goal, "create a plan for the objective below.")}`,
        "",
        "Produce:",
        "- A clear, ordered set of steps or milestones.",
        "- Key decisions and trade-offs at each stage.",
        "- Dependencies, risks, and a rough sequencing.",
        "",
        "Be concrete and actionable. Note any assumptions you make about scope or constraints.",
      ].join("\n"),
  },
  {
    category: "writing",
    label: "Writing",
    signals: [
      "write",
      "rewrite",
      "draft",
      "essay",
      "email",
      "blog",
      "article",
      "post",
      "copy",
      "caption",
      "cover letter",
      "resume",
      "summary",
      "summarize",
      "summarise",
      "paragraph",
      "story",
      "proofread",
      "edit",
      "tone",
      "message",
    ],
    template: (goal) =>
      [
        "Act as a professional writer and editor.",
        "",
        `Task: ${asSentence(goal, "write the piece described below.")}`,
        "",
        "Before writing, assume (and state) sensible defaults for:",
        "- Audience and purpose.",
        "- Tone (e.g. friendly, formal, persuasive).",
        "- Length.",
        "",
        "Deliver polished, ready-to-use text. Avoid filler and clichés.",
      ].join("\n"),
  },
  {
    category: "learning",
    label: "Learning",
    signals: [
      "explain",
      "what is",
      "what are",
      "how does",
      "how do",
      "teach me",
      "understand",
      "learn",
      "difference between",
      "concept",
      "example of",
      "why does",
      "meaning of",
      "eli5",
      "tutorial",
      "guide me",
    ],
    template: (goal) =>
      [
        "Act as an expert teacher who explains things clearly.",
        "",
        `Explain: ${asSentence(goal, "the topic below.")}`,
        "",
        "Structure the answer:",
        "- A plain-language summary first.",
        "- Then the key details, building up step by step.",
        "- A concrete example or analogy.",
        "",
        "Assume a smart beginner. Define jargon the first time you use it.",
      ].join("\n"),
  },
  {
    category: "health",
    label: "Health & fitness",
    signals: [
      "health",
      "fitness",
      "workout",
      "exercise",
      "diet",
      "nutrition",
      "lose weight",
      "weight loss",
      "gain muscle",
      "calories",
      "meal plan",
      "sleep",
      "stress",
      "mental health",
      "wellness",
      "routine",
      "gym",
      "running",
    ],
    template: (goal) =>
      [
        "Act as a knowledgeable health and fitness coach.",
        "",
        `Goal: ${asSentence(goal, "improve the health goal described below.")}`,
        "",
        "Provide:",
        "- Practical, evidence-based guidance.",
        "- A concrete starting routine or plan.",
        "- What to track and how to adjust over time.",
        "",
        "Tailor advice to typical constraints, and ask for relevant details (age, current level, limitations) if they materially change the answer.",
        "",
        "Note: general information only, not a substitute for professional medical advice.",
      ].join("\n"),
  },
  {
    category: "business",
    label: "Business",
    signals: [
      "business",
      "startup",
      "marketing",
      "sales",
      "customers",
      "revenue",
      "pricing",
      "growth",
      "market",
      "product",
      "pitch",
      "monetize",
      "monetise",
      "campaign",
      "audience",
      "brand",
      "go to market",
    ],
    template: (goal) =>
      [
        "Act as a pragmatic business strategist.",
        "",
        `Objective: ${asSentence(goal, "the business goal below.")}`,
        "",
        "Deliver:",
        "- A focused recommendation, not a generic overview.",
        "- The key levers and the trade-offs between them.",
        "- A short list of next actions.",
        "",
        "Be specific and realistic about resources. State assumptions about the market and stage.",
      ].join("\n"),
  },
  {
    category: "data",
    label: "Data & analysis",
    signals: [
      "data",
      "analyze",
      "analyse",
      "analysis",
      "dataset",
      "spreadsheet",
      "chart",
      "graph",
      "statistics",
      "metrics",
      "trends",
      "excel",
      "csv",
      "query",
      "report",
      "insights",
      "visualize",
      "visualise",
    ],
    template: (goal) =>
      [
        "Act as a data analyst.",
        "",
        `Task: ${asSentence(goal, "analyse the data described below.")}`,
        "",
        "Provide:",
        "- The approach and any assumptions about the data.",
        "- The key findings, with the numbers that support them.",
        "- A clear takeaway and recommended next step.",
        "",
        "If the data format or columns are unclear, ask before assuming.",
      ].join("\n"),
  },
];

/** Fallback template when no category scores high enough. */
function generalTemplate(goal: string): string {
  return [
    "Act as an expert in the relevant domain.",
    "",
    `Task: ${asSentence(goal, "the request below.")}`,
    "",
    "Give a complete, specific, well-structured answer. State any assumptions you make, and ask a clarifying question if a key detail is missing.",
  ].join("\n");
}

/**
 * Score a single intent against the (lowercased) text. Multi-word signals are
 * weighted higher because they are more specific and less likely to be noise.
 */
function scoreIntent(def: IntentDef, lower: string, goalStart: string): number {
  let score = 0;
  for (const signal of def.signals) {
    const escaped = signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Word-bounded match so "api" doesn't match "rapid".
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) {
      score += signal.includes(" ") ? 2 : 1;
      // The verb the request opens with is a strong intent signal: "explain ..."
      // leans learning even if it mentions JavaScript. Kept at +1 so concrete
      // domain nouns (function, api, dataset, ...) can still outweigh an
      // ambiguous lead verb like "write" or "build".
      if (goalStart.startsWith(signal)) score += 1;
    }
  }
  return score;
}

/**
 * Detect the most likely intent of a prompt. Returns the winning category, a
 * human label, and a 0–1 confidence. Falls back to `"general"` when nothing
 * scores.
 */
export function detectIntent(input: string): IntentMatch {
  const lower = ` ${input.toLowerCase()} `;
  // The bare goal's opening words, for leading-verb weighting.
  const goalStart = extractGoal(input).toLowerCase();

  let best: IntentDef | null = null;
  let bestScore = 0;
  for (const def of INTENTS) {
    const score = scoreIntent(def, lower, goalStart);
    if (score > bestScore) {
      bestScore = score;
      best = def;
    }
  }

  if (!best || bestScore === 0) {
    return { category: "general", label: "General", confidence: 0 };
  }

  // Confidence: saturating, so 3+ signal hits reads as "high".
  const confidence = Math.min(1, bestScore / 3);
  return { category: best.category, label: best.label, confidence: Math.round(confidence * 100) / 100 };
}

/**
 * Build a canonical, structured prompt for the given (already-cleaned) text,
 * using the detected intent's template. `intent` may be passed in to avoid a
 * second detection pass.
 */
export function buildIntentPrompt(input: string, intent?: IntentMatch): string {
  const match = intent ?? detectIntent(input);
  const goal = extractGoal(input);

  const def = INTENTS.find((d) => d.category === match.category);
  return def ? def.template(goal) : generalTemplate(goal);
}
