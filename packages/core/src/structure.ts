/**
 * Heuristic prompt restructuring.
 *
 * Good prompts separate *who the model is*, *what context it has*, *the task*,
 * *constraints*, and *the desired output format*. Users rarely write that way.
 * `restructurePrompt` performs a best-effort reorganization of a free-form
 * prompt into those labelled sections.
 *
 * This is deliberately conservative — it only moves a line into a section when
 * there is a strong textual signal. Everything it can't classify stays in the
 * Task section so no instruction is ever lost.
 */

interface Buckets {
  role: string[];
  context: string[];
  task: string[];
  constraints: string[];
  format: string[];
}

const CONSTRAINT_SIGNALS =
  /^(do not|don't|never|avoid|must not|don't use|do not use|make sure|ensure|always|must|should|limit|keep it|no more than|at most|at least|within \d)/i;

const FORMAT_SIGNALS =
  /(as (a )?(json|table|list|markdown|csv|bullet points?|numbered list|code block|code-block|code snippet)|in json|output format|return (a |the )?(json|table|list|markdown|answer as|result as|code)|format(ted)? as|respond (only )?(with|in)|use bullet points|in markdown|code block|as code)/i;

const ROLE_SIGNALS =
  /^(act as|you are|behave as|assume the role of|pretend (to be|you are)|as an? (expert|senior|professional))/i;

const CONTEXT_SIGNALS =
  /^(context:|background:|here is|here's|i have|i'm building|i am building|given|for reference|the situation is|my (project|app|code|setup))/i;

/** Split text into instruction units: lines, and sentences within long lines. */
function toUnits(text: string): string[] {
  const units: string[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    // A bullet or short line is one unit; a long paragraph is split by sentence.
    if (/^[-*]\s+/.test(line) || line.length < 120) {
      units.push(line);
    } else {
      for (const sentence of line.split(/(?<=[.!?])\s+/)) {
        const s = sentence.trim();
        if (s) units.push(s);
      }
    }
  }
  return units;
}

function classify(unit: string, buckets: Buckets): void {
  if (ROLE_SIGNALS.test(unit)) {
    buckets.role.push(unit);
  } else if (FORMAT_SIGNALS.test(unit)) {
    buckets.format.push(unit);
  } else if (CONSTRAINT_SIGNALS.test(unit)) {
    buckets.constraints.push(unit);
  } else if (CONTEXT_SIGNALS.test(unit)) {
    buckets.context.push(unit.replace(CONTEXT_SIGNALS, "").trim() || unit);
  } else {
    buckets.task.push(unit);
  }
}

function renderSection(title: string, lines: string[], bulletize: boolean): string | null {
  if (lines.length === 0) return null;
  if (lines.length === 1 && !bulletize) {
    return `## ${title}\n${lines[0]}`;
  }
  const body = lines
    .map((l) => (l.startsWith("-") || l.startsWith("*") ? l : `- ${l}`))
    .join("\n");
  return `## ${title}\n${body}`;
}

/**
 * Reorganize a free-form prompt into labelled sections. Returns the structured
 * markdown string. If the input is too short to benefit, it is returned as-is.
 */
export function restructurePrompt(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < 40) return trimmed;

  const buckets: Buckets = { role: [], context: [], task: [], constraints: [], format: [] };
  for (const unit of toUnits(trimmed)) classify(unit, buckets);

  // Nothing meaningful landed in non-task buckets → restructuring adds no value.
  const hasSignal =
    buckets.role.length + buckets.context.length + buckets.constraints.length + buckets.format.length > 0;
  if (!hasSignal) return trimmed;

  const sections = [
    renderSection("Role", buckets.role, false),
    renderSection("Context", buckets.context, true),
    renderSection("Task", buckets.task, buckets.task.length > 1),
    renderSection("Constraints", buckets.constraints, true),
    renderSection("Output format", buckets.format, true),
  ].filter((s): s is string => s !== null);

  return sections.join("\n\n");
}
