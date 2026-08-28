#!/usr/bin/env node
// Checks a breadcrumbs context file against the structure defined in
// skills/breadcrumbs/context-template.md. Catches format drift a model
// might introduce under lite-mode speed pressure — cheap, deterministic,
// doesn't need a model to run it. Also enforces that every Task Log entry
// carries a `Verified:` line, so an unverified checkoff fails structurally
// rather than depending on the model to notice.
//
// Usage: node scripts/validate-context-file.mjs <path> [...more paths]
//        node scripts/validate-context-file.mjs   (checks everything in .breadcrumbs/context/)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const STATUSES = ["understanding", "planning", "implementing", "pr-ready", "done"];
const ALWAYS_REQUIRED = ["## Original Story", "## Understanding Summary", "## Task Checklist"];
const CHECKBOX = /^- \[[ x]\] /;

function findTargets(args) {
  if (args.length > 0) return args;
  const dir = ".breadcrumbs/context";
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(dir, f));
}

function validate(path) {
  const errors = [];
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n");

  if (!lines[0]?.startsWith("# ")) errors.push("line 1 must be `# <Story title / ticket ID>`");

  const statusLine = lines.find((l) => l.startsWith("Status:"));
  if (!statusLine) {
    errors.push("missing `Status:` line");
  } else {
    const value = statusLine.replace("Status:", "").trim();
    if (!STATUSES.includes(value)) {
      errors.push(`Status "${value}" not one of: ${STATUSES.join(" | ")}`);
    }
  }

  for (const section of ALWAYS_REQUIRED) {
    if (!text.includes(section)) errors.push(`missing required section "${section}"`);
  }

  // Every Task Log entry needs a `Verified:` line (Step 3.4) — a checked-off
  // task with no recorded verification is the failure this catches, and it's
  // the one thing in the Task Log a resuming session can't re-derive.
  const logStart = lines.findIndex((l) => l.trim() === "## Task Log");
  if (logStart !== -1) {
    let heading = null;
    let headingLine = 0;
    let verified = false;
    const closeEntry = () => {
      if (heading && !verified) {
        errors.push(`Task Log entry "${heading}" (line ${headingLine}) has no \`- Verified:\` line`);
      }
    };
    for (let i = logStart + 1; i <= lines.length; i++) {
      const line = lines[i] ?? "## <eof>";
      if (line.startsWith("## ")) {
        closeEntry();
        break;
      }
      if (line.startsWith("### ")) {
        closeEntry();
        heading = line.replace(/^###\s*/, "").trim();
        headingLine = i + 1;
        verified = false;
        continue;
      }
      if (/^\s*-\s*Verified:/.test(line)) verified = true;
    }
  }

  const checklistStart = lines.findIndex((l) => l.trim() === "## Task Checklist");
  if (checklistStart !== -1) {
    for (let i = checklistStart + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("## ")) break;
      if (line.trim() === "" || line.startsWith("- [")) continue;
      if (line.trim().startsWith("-")) errors.push(`Task Checklist line ${i + 1} isn't a checkbox: "${line.trim()}"`);
    }
  }

  return errors;
}

const targets = findTargets(process.argv.slice(2));
if (targets.length === 0) {
  console.log("No context files found (.breadcrumbs/context/ empty or missing) — nothing to validate.");
  process.exit(0);
}

let failed = false;
for (const path of targets) {
  const errors = validate(path);
  if (errors.length === 0) {
    console.log(`OK   ${path}`);
  } else {
    failed = true;
    console.log(`FAIL ${path}`);
    for (const e of errors) console.log(`     - ${e}`);
  }
}
process.exit(failed ? 1 : 0);
