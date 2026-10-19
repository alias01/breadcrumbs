#!/usr/bin/env node
// PreToolUse hook (Edit|Write): blocks edits to a test file once its red run is
// recorded in a context file's Task Log (`- Red: <test file> › <name> — ...`),
// so a failing test gets fixed by changing the code, not the test (Step 3.4).
//
// Opt-in per repo: no-op unless `.breadcrumbs/freeze-tests` exists at the repo
// root. Unfreezing is a Scope Change: a test path named anywhere under the
// context file's "## Scope Changes" section is editable again.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { execSync } from "node:child_process";

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let event = {};
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0);
  }
  const target = event.tool_input?.file_path;
  if (!target) process.exit(0);

  const cwd = event.cwd ?? process.cwd();
  let root = cwd;
  try {
    root = execSync("git rev-parse --show-toplevel", { cwd, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {}
  if (!existsSync(join(root, ".breadcrumbs", "freeze-tests"))) process.exit(0);

  const contextDir = join(root, ".breadcrumbs", "context");
  if (!existsSync(contextDir)) process.exit(0);
  const rel = relative(root, resolve(cwd, target));

  for (const file of readdirSync(contextDir).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(contextDir, file), "utf8");
    if (!/^Status:\s*implementing/m.test(text)) continue;
    const scopeChanges = text.split(/^## Scope Changes/m)[1]?.split(/^## /m)[0] ?? "";
    for (const [, test] of text.matchAll(/^\s*-\s*Red:\s*(\S+)/gm)) {
      if (test === "n/a" || test !== rel || scopeChanges.includes(test)) continue;
      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason:
              `${rel} is frozen: its red run is recorded in .breadcrumbs/context/${file}. ` +
              "Fix the code, not the test. If the test itself is wrong, log a Scope Change naming this path (Step 3.7), then edit.",
          },
        })
      );
      process.exit(0);
    }
  }
  process.exit(0);
});
