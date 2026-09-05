#!/usr/bin/env node
// PreToolUse hook: shelving a fix to watch a test fail, then bringing it back, is denied.
//
// The router says a bug fix writes its regression test first and watches it fail on
// the tree as-is — that run is the repro. Measured (docs/decisions.md, 2026-09-04): said
// as prose, it held in one run of three; the other two stashed the finished fix, reran
// the suite to see the test go red, then popped the fix back. That "stash dance" cost
// 6-10 extra calls each time. Same lesson as the read guard: a rule the model follows
// two times in three is not a rule, so the shelve-and-restore path is made unavailable
// instead of re-argued. The cheap path — write the test, run it before touching the fix,
// then implement and run it again — needs no shelving and no extra calls.

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

const ADVICE =
  "Don't shelve the fix to prove the test fails. Write the regression test, run it now " +
  "on the tree as it is — that's the red. Then make the fix and run it again for green. " +
  "No stash, checkout, restore or revert needed either way.";

// Split on shell separators so `a && b`, `a; b`, `a | b` are each checked on their own.
function commands(cmd) {
  return cmd.split(/(?:&&|\|\||[;|])/).map((s) => s.trim());
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let event;
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0);
  }
  if (event.tool_name !== "Bash") process.exit(0);

  const cmd = String(event.tool_input?.command ?? "");
  for (const part of commands(cmd)) {
    if (!/^git\b/.test(part)) continue;

    // `git stash` (push/save/pop/apply/drop/clear) — not `list`/`show`, which only inspect.
    if (/^git\s+stash\b/.test(part) && !/^git\s+stash\s+(list|show)\b/.test(part)) {
      deny(`\`${part}\` shelves working-tree changes. ${ADVICE}`);
    }

    // `git checkout -- <path>` / `git checkout HEAD -- <path>` — discards a file's edits.
    if (/^git\s+checkout\b.*--\s+\S/.test(part)) {
      deny(`\`${part}\` discards the file's changes. ${ADVICE}`);
    }

    // `git restore <path>` without --staged discards working-tree changes.
    if (/^git\s+restore\b/.test(part) && !/--staged/.test(part)) {
      deny(`\`${part}\` discards the file's changes. ${ADVICE}`);
    }

    // `git revert` — undoes a commit; not part of proving an uncommitted fix's test.
    if (/^git\s+revert\b/.test(part)) {
      deny(`\`${part}\` undoes a commit. ${ADVICE}`);
    }
  }

  process.exit(0);
});
