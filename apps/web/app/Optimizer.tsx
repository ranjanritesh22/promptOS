"use client";

import { optimize, type OptimizeResult } from "@promptos/core";
import { useMemo, useState } from "react";

const SAMPLE =
  "I was wondering if you could please help me out. Basically, in order to improve my onboarding email, I would like you to rewrite it to be more concise and friendly. Due to the fact that our users are busy, it should be short. Please make sure to keep a call to action. Thanks in advance!";

export function Optimizer() {
  const [input, setInput] = useState(SAMPLE);
  const [enhance, setEnhance] = useState(false);

  const result: OptimizeResult = useMemo(
    () => optimize(input, { enhance }),
    [input, enhance],
  );

  const { stats, intent } = result;

  return (
    <div className="optimizer">
      <div className="opt-controls">
        <div className="opt-modes" role="tablist" aria-label="Mode">
          <button
            type="button"
            role="tab"
            aria-selected={!enhance}
            className={`opt-mode ${!enhance ? "opt-mode--active" : ""}`}
            onClick={() => setEnhance(false)}
          >
            Optimize
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={enhance}
            className={`opt-mode ${enhance ? "opt-mode--active" : ""}`}
            onClick={() => setEnhance(true)}
          >
            Enhance
          </button>
        </div>

        <span className="opt-hint">
          {enhance
            ? "Rewrites into a structured prompt for the detected topic."
            : "Fixes grammar, spelling & wordiness — same meaning, better English."}
        </span>

        <span className="opt-intent" title={`Confidence ${Math.round(intent.confidence * 100)}%`}>
          Intent: <strong>{intent.label}</strong>
        </span>
      </div>

      <div className="opt-grid">
        <div className="opt-col">
          <div className="opt-col__head">
            <span>Your prompt</span>
            <span className="badge">{stats.originalTokens} tokens</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste a prompt…"
          />
        </div>

        <div className="opt-col">
          <div className="opt-col__head">
            <span>{enhance ? "Enhanced" : "Optimized"}</span>
            <span className={`badge ${stats.saved > 0 ? "badge--good" : ""}`}>
              {stats.optimizedTokens} tokens · {stats.saved >= 0 ? "−" : "+"}
              {Math.abs(stats.saved)} ({stats.savedPercent}%)
            </span>
          </div>
          <textarea value={result.optimized} readOnly spellCheck={false} />
        </div>
      </div>

      {result.changes.length > 0 && (
        <details className="opt-changes">
          <summary>
            {result.changes.length} change{result.changes.length === 1 ? "" : "s"} applied
          </summary>
          <ul>
            {result.changes.map((c, i) => (
              <li key={i}>
                {c.description}
                {c.count > 1 ? ` (×${c.count})` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
