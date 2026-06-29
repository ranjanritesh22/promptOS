import assert from "node:assert/strict";
import { test } from "node:test";

import { buildIntentPrompt, detectIntent, extractGoal } from "./intents.js";
import { optimize } from "./optimizer.js";

test("detectIntent: coding", () => {
  assert.equal(detectIntent("build me a react component for a todo list").category, "coding");
});

test("detectIntent: debugging beats coding when error signals present", () => {
  assert.equal(detectIntent("my react function throws an error and is not working").category, "debugging");
});

test("detectIntent: planning", () => {
  assert.equal(detectIntent("help me plan a roadmap with milestones for launch").category, "planning");
});

test("detectIntent: health", () => {
  assert.equal(detectIntent("i want to lose weight and build a workout routine").category, "health");
});

test("detectIntent: falls back to general with zero confidence", () => {
  const m = detectIntent("hmm");
  assert.equal(m.category, "general");
  assert.equal(m.confidence, 0);
});

test("extractGoal: strips leading request framing", () => {
  assert.equal(extractGoal("i want to build a todo app in react"), "build a todo app in react");
  assert.equal(extractGoal("Can you please help me write an email"), "write an email");
});

test("extractGoal: strips trailing courtesy", () => {
  assert.equal(extractGoal("write a poem, thanks in advance!"), "write a poem");
});

test("buildIntentPrompt: coding template names the goal", () => {
  const out = buildIntentPrompt("i want to build a todo app in react");
  assert.match(out, /senior software engineer/i);
  assert.match(out, /build a todo app in react/i);
});

test("optimize: enhance produces a structured intent prompt", () => {
  const r = optimize("can you make me a website for my bakery", { enhance: true });
  assert.equal(r.intent.category, "coding");
  assert.match(r.optimized, /Act as a senior software engineer/i);
  assert.ok(r.changes.some((c) => c.rule === "enhance"));
});

test("optimize: always reports an intent even without enhance", () => {
  const r = optimize("explain how promises work in javascript");
  assert.equal(r.intent.category, "learning");
});
