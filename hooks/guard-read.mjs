#!/usr/bin/env node
// PreToolUse hook: a large file can only be read as a line range.
//
// The router's "Output budget" asks for ranged reads; measured, the agent
// ignored that in six runs out of six and read a 900-line file whole every
// time (docs/decisions.md, 2026-09-04). A rule the model follows zero times
// is not a rule, so this makes the whole-file path unavailable: a Read
// without a bounded `limit`, or a `cat` of the same file in Bash, is denied
// with the alternative spelled out. Small files pass untouched.
//
// Thresholds are lines, not tokens: cheap to count and what the model sees.

import { existsSync, readFileSync, statSync } from "node:fs";

const MAX_WHOLE_LINES = Number(process.env.BREADCRUMBS_READ_MAX_LINES ?? 300);
const MAX_RANGE_LINES = Number(process.env.BREADCRUMBS_READ_MAX_RANGE ?? 200);

function lineCount(path) {
  try {
    if (!existsSync(path) || !statSync(path).isFile()) return 0;
    return readFileSync(path, "utf8").split("\n").length;
  } catch {
    return 0;
  }
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}

const advice = (path, lines) =>
  `${path} is ${lines} lines. Files over ${MAX_WHOLE_LINES} lines are read as a range: ` +
  `Grep for the symbol first, then Read with offset + limit (limit ≤ ${MAX_RANGE_LINES}). ` +
  `Every whole-file read is re-sent on every later call.`;

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let event;
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0);
  }
  const tool = event.tool_name;
  const args = event.tool_input ?? {};

  if (tool === "Read") {
    const path = args.file_path;
    const lines = lineCount(path);
    if (lines > MAX_WHOLE_LINES) {
      if (args.limit == null) deny(advice(path, lines));
      if (Number(args.limit) > MAX_RANGE_LINES) {
        deny(`limit ${args.limit} is over ${MAX_RANGE_LINES}. ` + advice(path, lines));
      }
    }
  }

  if (tool === "Bash") {
    const cmd = String(args.command ?? "");
    // Only `cat` — sed -n 'a,bp', head and tail are already ranges.
    if (/(^|[\s;&|(])cat\s/.test(cmd)) {
      for (const token of cmd.split(/\s+/)) {
        const path = token.replace(/^['"]|['"]$/g, "");
        const lines = lineCount(path);
        if (lines > MAX_WHOLE_LINES) deny(`cat ${path}: ` + advice(path, lines));
      }
    }
  }

  process.exit(0);
});
