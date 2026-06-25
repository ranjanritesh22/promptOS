"use client";

import { optimize, type Aggressiveness, type OptimizeResult } from "@promptos/core";
import { useMemo, useState } from "react";

const SAMPLE =
  "I was wondering if you could please help me out. Basically, in order to improve my onboarding email, I would like you to rewrite it to be more concise and friendly. Due to the fact that our users are busy, it should be short. Please make sure to keep a call to action. Thanks in advance!";

export function Optimizer() {
  const [input, setInput] = useState(SAMPLE);
  const [aggressiveness, setAggressiveness] = useState<Aggressiveness>("balanced");
  const [restructure, setRestructure] = useState(false);

  const result: OptimizeResult = useMemo(
    () => optimize(input, { aggressiveness, restructure }),
    [input, aggressiveness, restructure],
  );

  const { stats } = result;

  return (
    <div className="optimizer">
      <div className="opt-controls">
        <label>
          Strength
          <select
            value={aggressiveness}
            onChange={(e) => setAggressiveness(e.target.value as Aggressiveness)}
          >
            <option value="light">Light</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={restructure}
            onChange={(e) => setRestructure(e.target.checked)}
          />
          Restructure into sections
        </label>
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
            <span>Optimized</span>
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
