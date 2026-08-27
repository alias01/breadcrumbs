#!/usr/bin/env node
// Generates a CHANGELOG.md entry for the version in VERSION, from commits
// since the last git tag (or full history, for the first release).
// Versioning itself is manual — this only turns already-made commits into
// a changelog, it never decides or bumps the version number.
//
// Usage: node scripts/generate-changelog.mjs
//   1. Bump VERSION by hand first.
//   2. Run this — prepends a new CHANGELOG.md section.
//   3. Review/edit the result, commit, then tag: git tag vX.Y.Z && git push origin vX.Y.Z

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const VERSION = readFileSync("VERSION", "utf8").trim();
const TYPE_LABELS = {
  feat: "Features",
  fix: "Fixes",
  perf: "Performance",
  refactor: "Refactoring",
  docs: "Documentation",
};
const MAINTENANCE_TYPES = new Set(["chore", "style", "test", "build", "ci"]);
const SECTION_ORDER = ["feat", "fix", "perf", "refactor", "docs", "maintenance", "other"];

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function lastTag() {
  try {
    return sh("git describe --tags --abbrev=0");
  } catch {
    return null;
  }
}

const since = lastTag();
const range = since ? `${since}..HEAD` : "";
const subjects = sh(`git log ${range} --pretty=format:%s`.trim())
  .split("\n")
  .filter(Boolean);

if (subjects.length === 0) {
  console.log(since ? `No commits since ${since} — nothing to add.` : "No commits found.");
  process.exit(0);
}

const buckets = Object.fromEntries(SECTION_ORDER.map((k) => [k, []]));
// Types and the optional `!` breaking marker must stay in step with
// skills/breadcrumbs/scripts/validate-commit-message.mjs — a type that
// validates on commit but doesn't parse here silently lands in "Other".
const CONVENTIONAL = /^(feat|fix|perf|refactor|docs|style|test|chore|build|ci)(\([\w./-]+\))?!?: (.+)/;

for (const subject of subjects) {
  const match = subject.match(CONVENTIONAL);
  if (!match) {
    buckets.other.push(subject);
    continue;
  }
  const [, type, scope, desc] = match;
  const entry = scope ? `**${scope.slice(1, -1)}:** ${desc}` : desc;
  if (type in TYPE_LABELS) buckets[type].push(entry);
  else if (MAINTENANCE_TYPES.has(type)) buckets.maintenance.push(entry);
  else buckets.other.push(subject);
}

const date = new Date().toISOString().slice(0, 10);
let section = `## [${VERSION}] - ${date}\n`;
for (const key of SECTION_ORDER) {
  if (buckets[key].length === 0) continue;
  const label = TYPE_LABELS[key] ?? (key === "maintenance" ? "Maintenance" : "Other");
  section += `\n### ${label}\n`;
  for (const entry of buckets[key]) section += `- ${entry}\n`;
}

const header = "# Changelog\n\nFormat based on [Keep a Changelog](https://keepachangelog.com/). Versions are bumped manually — see VERSION.\n";
const existing = existsSync("CHANGELOG.md") ? readFileSync("CHANGELOG.md", "utf8") : header;
const body = existing.startsWith("# Changelog") ? existing.slice(header.length) : existing;

writeFileSync("CHANGELOG.md", `${header}\n${section}\n${body.trim()}\n`.replace(/\n{3,}/g, "\n\n"));
console.log(`CHANGELOG.md updated for ${VERSION} (${since ? `since ${since}` : "full history"}, ${subjects.length} commits).`);
