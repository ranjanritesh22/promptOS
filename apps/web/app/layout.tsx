import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptOS — AI Prompt Composer",
  description:
    "Optimize your prompts: fewer tokens, clearer context, better results. Works on the web and inside ChatGPT, Claude, Gemini, Perplexity & Cursor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
