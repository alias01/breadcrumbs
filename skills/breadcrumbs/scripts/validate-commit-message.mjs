#!/usr/bin/env node
// Checks a commit message against the Conventional Commits format defined
// in skills/breadcrumbs/step3-implement.md (Step 3.5).
//
// Usage: node scripts/validate-commit-message.mjs <path-to-message-file>
//        node scripts/validate-commit-message.mjs -m "feat(auth): add reset flow"
//        git log -1 --format=%B | node scripts/validate-commit-message.mjs

import { readFileSync } from "node:fs";

const TYPES = ["feat", "fix", "docs", "style", "refactor", "test", "chore"];
const HEADER = new RegExp(`^(${TYPES.join("|")})(\\([\\w./-]+\\))?: .+`);

function readMessage(argv) {
  if (argv[0] === "-m") return argv[1] ?? "";
  if (argv[0]) return readFileSync(argv[0], "utf8");
  return readFileSync(0, "utf8"); // stdin
}

const message = readMessage(process.argv.slice(2)).trimEnd();
const lines = message.split("\n");
const errors = [];

if (!lines[0]) {
  errors.push("empty commit message");
} else {
  if (!HEADER.test(lines[0])) {
    errors.push(`header "${lines[0]}" doesn't match "<type>(<scope>): <summary>" — type must be one of ${TYPES.join(", ")}`);
  }
  if (lines[0].length > 72) errors.push(`header is ${lines[0].length} chars, keep it under 72`);
  if (lines.length > 1 && lines[1] !== "") errors.push("line 2 must be blank before the body");
}

if (errors.length === 0) {
  console.log("OK");
  process.exit(0);
} else {
  for (const e of errors) console.log(`FAIL - ${e}`);
  process.exit(1);
}
