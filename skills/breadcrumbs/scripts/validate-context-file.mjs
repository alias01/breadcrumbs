#!/usr/bin/env node
// Checks a breadcrumbs context file against the structure defined in
// skills/breadcrumbs/context-template.md. Catches format drift a model
// might introduce under lite-mode speed pressure — cheap, deterministic,
// doesn't need a model to run it.
//
// Usage: node scripts/validate-context-file.mjs <path> [...more paths]
//        node scripts/validate-context-file.mjs   (checks everything in .breadcrumbs/context/)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// Five working states plus two parked ones (see context-template.md).
const STATUSES = ["understanding", "planning", "implementing", "pr-ready", "done", "blocked", "abandoned"];
// A story that reached a PR draft: both anchors below must be present.
const DRAFTED = ["pr-ready", "done"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
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
  let status = "";
  if (!statusLine) {
    errors.push("missing `Status:` line");
  } else {
    status = statusLine.replace("Status:", "").trim();
    if (!STATUSES.includes(status)) {
      errors.push(`Status "${status}" not one of: ${STATUSES.join(" | ")}`);
    }
  }

  for (const section of ALWAYS_REQUIRED) {
    if (!text.includes(section)) errors.push(`missing required section "${section}"`);
  }

  const checklistStart = lines.findIndex((l) => l.trim() === "## Task Checklist");
  if (checklistStart !== -1) {
    let boxes = 0;
    for (let i = checklistStart + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("## ")) break;
      if (line.trim() === "") continue;
      if (CHECKBOX.test(line)) {
        boxes++;
        continue;
      }
      if (line.trim().startsWith("-")) errors.push(`Task Checklist line ${i + 1} isn't a checkbox: "${line.trim()}"`);
    }
    // A file past the planning gate with no tasks means the breakdown never
    // landed — the section header alone used to pass. `blocked` and
    // `abandoned` are exempt: a story can park before it was ever broken down.
    const planned = ["implementing", ...DRAFTED].includes(status);
    if (boxes === 0 && planned) errors.push(`Status "${status}" but Task Checklist has no tasks`);
  }

  // Step 4.7 writes the `Last drafted:` anchor at the same moment it sets
  // pr-ready; one without the other means the gate write was half-applied.
  // `done` inherits both checks — it can only be reached through pr-ready.
  if (DRAFTED.includes(status)) {
    if (!/^Last drafted:/m.test(text)) {
      errors.push(`Status "${status}" but no \`Last drafted:\` line under \`## PR Summary\``);
    }

    // That gate also requires the Step 3.6 verification run. Missing block =
    // the run never happened, or happened and wasn't recorded — either way
    // the PR's Test line is unbacked.
    const run = text.match(/^Last run:.*$/m);
    if (!run) {
      errors.push(`Status "${status}" but no \`Last run:\` line under \`## Verification\``);
    } else if (/—\s*red\b/.test(run[0])) {
      errors.push(`Status "${status}" but verification is red: "${run[0].trim()}"`);
    }
  }

  // Dates are ISO 8601 everywhere (context-template.md, "Content style"). Only
  // the two anchored lines have a fixed enough shape to check deterministically
  // — and they're the two other tooling reads back, so drift there costs most.
  for (const label of ["Last drafted", "Last run"]) {
    const line = text.match(new RegExp(`^${label}:\\s*(\\S+)`, "m"));
    if (line && !ISO_DATE.test(line[1])) {
      errors.push(`\`${label}: ${line[1]}\` isn't an ISO 8601 date (YYYY-MM-DD)`);
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
