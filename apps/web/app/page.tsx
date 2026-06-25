import { VERSION } from "@promptos/core";
import { Optimizer } from "./Optimizer";

export default function Home() {
  return (
    <main className="page">
      <header className="hero">
        <span className="logo" aria-hidden>
          ✦
        </span>
        <h1>PromptOS</h1>
        <p className="tagline">
          An AI prompt composer. Turn rough prompts into concise, well-structured instructions —
          fewer tokens, clearer context, better results.
        </p>
        <div className="platforms">
          {["ChatGPT", "Claude", "Gemini", "Perplexity", "Cursor"].map((p) => (
            <span className="chip" key={p}>
              {p}
            </span>
          ))}
        </div>
      </header>

      <section className="demo">
        <h2>Try it live</h2>
        <p className="muted">
          This runs the exact same <code>@promptos/core</code> engine that powers the browser
          extension — entirely in your browser. Nothing is sent anywhere.
        </p>
        <Optimizer />
      </section>

      <section className="features">
        <div className="feature">
          <h3>Local-first</h3>
          <p>Deterministic, offline optimization. No API keys, no network calls, no data leaves your machine.</p>
        </div>
        <div className="feature">
          <h3>Token-aware</h3>
          <p>See estimated token savings before and after, plus exactly which changes were applied.</p>
        </div>
        <div className="feature">
          <h3>Everywhere you write</h3>
          <p>The companion extension adds an Optimize button right inside your favourite AI chat boxes.</p>
        </div>
      </section>

      <footer className="foot">
        <span>PromptOS · v{VERSION}</span>
        <a href="https://github.com/frontend-realm/promptOS">GitHub</a>
      </footer>
    </main>
  );
}
