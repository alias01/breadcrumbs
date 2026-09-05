#!/usr/bin/env node
// UserPromptSubmit hook: estimates how full the session's context window is
// from the transcript's own token-usage numbers, and nudges toward a
// checkpoint once it crosses a threshold — instead of leaving that to
// whatever mid-flight break or topic shift happens to fire first, which may
// never come on a long, uneventful story before auto-compaction (or the
// harness's own context limit) silently summarizes away the reasoning trail
// breadcrumbs exists to keep.
//
// Estimate, not ground truth: it sums the last turn's reported token usage
// (input + cache read + cache creation + output), which approximates but
// doesn't exactly match the harness's own accounting (system prompt, tool
// schemas, skills). Default window assumes a standard 200k-token model —
// override BREADCRUMBS_CONTEXT_WINDOW (env) if running on an extended
// context tier.

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const CONTEXT_WINDOW = Number(process.env.BREADCRUMBS_CONTEXT_WINDOW) || 200_000;
const THRESHOLDS = [50, 75, 90]; // percent; each crossed once per session

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    run(JSON.parse(input));
  } catch {
    // No stdin JSON, no transcript, malformed line — never block the prompt.
  }
  process.exit(0);
});

function run(payload) {
  const sessionId = payload.session_id || process.env.CLAUDE_CODE_SESSION_ID;
  if (!sessionId) return;

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const sanitized = projectDir.replace(/[/\\]/g, "-");
  const transcriptPath =
    payload.transcript_path ||
    join(homedir(), ".claude", "projects", sanitized, `${sessionId}.jsonl`);
  if (!existsSync(transcriptPath)) return;

  const usage = lastUsage(transcriptPath);
  if (!usage) return;

  const used =
    (usage.input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.cache_read_input_tokens || 0) +
    (usage.output_tokens || 0);
  const pct = Math.floor((used / CONTEXT_WINDOW) * 100);

  const crossed = THRESHOLDS.filter((t) => pct >= t).pop();
  if (!crossed) return;

  const statePath = join(tmpdir(), `breadcrumbs-ctx-${sessionId}.json`);
  const lastWarned = readState(statePath);
  if (crossed <= lastWarned) return;
  writeFileSync(statePath, JSON.stringify({ lastWarned: crossed }));

  const usedK = Math.round(used / 1000);
  const windowK = Math.round(CONTEXT_WINDOW / 1000);
  console.log(
    `Context usage is now ~${pct}% (~${usedK}k/${windowK}k tokens estimated). ` +
      `If a breadcrumbs story is in flight, checkpoint it now — the "Context growth" ` +
      `trigger in SKILL.md applies even with no test failure or scope change — then read ` +
      `minimal-context-mode.md (first time only) and follow it for the rest of this story ` +
      `in this session. Tell the user their session context has crossed ${crossed}% and ` +
      `suggest continuing this story in a fresh session; resume.md picks it back up ` +
      `automatically. No story in flight → just mention the context level.`
  );
}

function lastUsage(transcriptPath) {
  const lines = readFileSync(transcriptPath, "utf8").split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const usage = JSON.parse(line)?.message?.usage;
      if (usage) return usage;
    } catch {
      // Skip malformed/partial lines (e.g. a truncated last write).
    }
  }
  return null;
}

function readState(statePath) {
  if (!existsSync(statePath)) return 0;
  try {
    return JSON.parse(readFileSync(statePath, "utf8")).lastWarned || 0;
  } catch {
    return 0;
  }
}
