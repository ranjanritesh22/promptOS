import assert from "node:assert/strict";
import { test } from "node:test";

import { optimize } from "./optimizer.js";
import { estimateTokens } from "./tokenizer.js";
import { restructurePrompt } from "./structure.js";

test("estimateTokens: empty and basic", () => {
  assert.equal(estimateTokens(""), 0);
  assert.equal(estimateTokens("   "), 0);
  assert.ok(estimateTokens("hello world") >= 2);
});

test("optimize: collapses whitespace (light)", () => {
  // Whitespace is collapsed; the always-on grammar pass also capitalizes the
  // first letter and adds a terminal period.
  const r = optimize("hello     world\n\n\n\nfoo  ", { aggressiveness: "light" });
  assert.equal(r.optimized, "Hello world\n\nfoo.");
});

test("optimize: grammar fixes apostrophes, spelling, and a lone 'i'", () => {
  const r = optimize("pls fix my code, it dont work and i cant run it", { aggressiveness: "light" });
  assert.match(r.optimized, /don't/);
  assert.match(r.optimized, /can't/);
  assert.match(r.optimized, /\bI\b/);
  assert.match(r.optimized, /\.$/);
});

test("optimize: replaces wordy phrases (balanced)", () => {
  const r = optimize("Please summarize this in order to save time.", { aggressiveness: "balanced" });
  assert.match(r.optimized.toLowerCase(), /\bto save time\b/);
  assert.doesNotMatch(r.optimized.toLowerCase(), /in order to/);
});

test("optimize: strips filler openers", () => {
  const r = optimize("I was wondering if you could write a haiku about the sea.", {
    aggressiveness: "balanced",
  });
  assert.match(r.optimized.toLowerCase(), /^write a haiku/);
});

test("optimize: removes politeness", () => {
  const r = optimize("Please refactor this function. Thanks in advance!", {
    aggressiveness: "balanced",
  });
  assert.doesNotMatch(r.optimized.toLowerCase(), /\bplease\b/);
  assert.doesNotMatch(r.optimized.toLowerCase(), /thanks in advance/);
});

test("optimize: aggressive removes hedges and dedupes", () => {
  const input = "Just write a really simple function.\nWrite a really simple function.";
  const r = optimize(input, { aggressiveness: "aggressive" });
  assert.doesNotMatch(r.optimized.toLowerCase(), /\bjust\b/);
  assert.doesNotMatch(r.optimized.toLowerCase(), /\breally\b/);
  // duplicate second line should be gone
  assert.equal(r.optimized.split("\n").filter(Boolean).length, 1);
});

test("optimize: light does not run balanced/aggressive rules", () => {
  const r = optimize("Please do this in order to win.", { aggressiveness: "light" });
  assert.match(r.optimized.toLowerCase(), /please/);
  assert.match(r.optimized.toLowerCase(), /in order to/);
});

test("optimize: reports positive token savings on wordy input", () => {
  const input =
    "I was wondering if you could please, in order to help me, basically just write a function that is able to add two numbers. Thanks in advance!";
  const r = optimize(input, { aggressiveness: "aggressive" });
  assert.ok(r.stats.saved > 0, "expected tokens to be saved");
  assert.ok(r.stats.optimizedTokens < r.stats.originalTokens);
  assert.ok(r.changes.length > 0);
});

test("optimize: never throws on empty input", () => {
  const r = optimize("", { aggressiveness: "aggressive", restructure: true });
  assert.equal(r.optimized, "");
  assert.equal(r.stats.saved, 0);
});

test("restructure: organizes into sections when signals present", () => {
  const input =
    "You are an expert Go developer. I am building a CLI tool. Add a flag to parse JSON. Do not use external libraries. Return the answer as a code block.";
  const out = restructurePrompt(input);
  assert.match(out, /## Role/);
  assert.match(out, /## Constraints/);
  assert.match(out, /## Output format/);
});

test("restructure: leaves short / signal-free input untouched", () => {
  const input = "Write a poem about rain.";
  assert.equal(restructurePrompt(input), input);
});

test("optimize: restructure option records a change", () => {
  const input =
    "You are a senior engineer. Refactor the function. Do not change its behavior. Respond with only code.";
  const r = optimize(input, { aggressiveness: "balanced", restructure: true });
  assert.ok(r.changes.some((c) => c.rule === "restructure"));
  assert.match(r.optimized, /## /);
});
