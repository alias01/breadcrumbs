// Unit tests for the two deterministic validators. The skill's *behavior*
// can't be asserted on (see scenarios.md) — these scripts can, and they're the
// part the skill blocks a gate on.
//
// Run: node --test "skills/breadcrumbs/tests/**/*.test.mjs"

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CONTEXT_VALIDATOR = join(here, "..", "scripts", "validate-context-file.mjs");
const COMMIT_VALIDATOR = join(here, "..", "scripts", "validate-commit-message.mjs");
const FIXTURE = join(here, "fixtures", "valid-story.md");

const runCommit = (header) =>
  spawnSync("node", [COMMIT_VALIDATOR, "-m", header], { encoding: "utf8" }).status;

function runContext(body) {
  const dir = mkdtempSync(join(tmpdir(), "breadcrumbs-test-"));
  const path = join(dir, "story.md");
  writeFileSync(path, body);
  return spawnSync("node", [CONTEXT_VALIDATOR, path], { encoding: "utf8" }).status;
}

const fixture = (overrides = {}) => {
  const base = {
    title: "# PARK-1: Do the thing",
    status: "Status: implementing",
    sections: "## Original Story\nx\n\n## Understanding Summary\nx\n\n## Task Checklist\n- [ ] Task 1 — x — files: a.ts",
  };
  const { title, status, sections, branch = "Branch: feature/x" } = { ...base, ...overrides };
  return `${title}\n${status}\n${branch}\n\n${sections}\n`;
};

test("commit: accepts every documented type", () => {
  for (const type of ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "build", "ci"]) {
    assert.equal(runCommit(`${type}(scope): do a thing`), 0, `${type} should pass`);
  }
});

test("commit: accepts a scopeless header", () => {
  assert.equal(runCommit("fix: do a thing"), 0);
});

test("commit: accepts a breaking-change marker", () => {
  assert.equal(runCommit("feat(api)!: drop v1 endpoint"), 0);
  assert.equal(runCommit("feat!: drop v1 endpoint"), 0);
});

test("commit: accepts the header git revert generates", () => {
  // Step 3.6 / scenario 5 mandate `git revert`; rejecting its own header would
  // make the skill contradict itself.
  assert.equal(runCommit('Revert "feat(auth): add reset flow"'), 0);
});

test("commit: rejects an unknown type", () => {
  assert.equal(runCommit("nope(x): bad type"), 1);
});

test("commit: rejects an empty summary", () => {
  assert.equal(runCommit("feat:"), 1);
});

test("commit: rejects an over-long header", () => {
  assert.equal(runCommit(`feat(scope): ${"x".repeat(80)}`), 1);
});

test("context: the golden fixture passes", () => {
  assert.equal(spawnSync("node", [CONTEXT_VALIDATOR, FIXTURE], { encoding: "utf8" }).status, 0);
});

test("context: rejects a missing title", () => {
  assert.equal(runContext(fixture({ title: "PARK-1: no hash" })), 1);
});

test("context: rejects a missing Status line", () => {
  assert.equal(runContext(fixture({ status: "" })), 1);
});

test("context: rejects an unknown Status value", () => {
  assert.equal(runContext(fixture({ status: "Status: vibing" })), 1);
});

test("context: rejects a missing required section", () => {
  assert.equal(runContext(fixture({ sections: "## Original Story\nx\n\n## Task Checklist\n- [ ] Task 1" })), 1);
});

test("context: rejects a non-checkbox line in the Task Checklist", () => {
  assert.equal(
    runContext(fixture({ sections: "## Original Story\nx\n\n## Understanding Summary\nx\n\n## Task Checklist\n- Task 1 (no box)" })),
    1
  );
});

test("context: rejects an empty checklist once past planning", () => {
  const sections = "## Original Story\nx\n\n## Understanding Summary\nx\n\n## Task Checklist\n";
  assert.equal(runContext(fixture({ status: "Status: implementing", sections })), 1);
});

test("context: allows an empty checklist while still understanding", () => {
  const sections = "## Original Story\nx\n\n## Understanding Summary\nx\n\n## Task Checklist\n";
  assert.equal(runContext(fixture({ status: "Status: understanding", sections })), 0);
});

const PR_READY_SECTIONS = [
  "## Original Story\nx",
  "## Understanding Summary\nx",
  "## Task Checklist\n- [x] Task 1 — x — files: a.ts",
  "## Verification\nLast run: 2026-08-27 — `npm test` — green",
  "## PR Summary\nLast drafted: 2026-08-27",
].join("\n\n");

test("context: rejects pr-ready with no `Last drafted:` anchor", () => {
  const sections = PR_READY_SECTIONS.replace("## PR Summary\nLast drafted: 2026-08-27", "## PR Summary");
  assert.equal(runContext(fixture({ status: "Status: pr-ready", sections })), 1);
});

test("context: rejects pr-ready with no verification run", () => {
  // Step 3's gate now requires the 3.6 run; a pr-ready file without it means
  // the PR's Test line has nothing behind it.
  const sections = PR_READY_SECTIONS.replace("## Verification\nLast run: 2026-08-27 — `npm test` — green", "## Verification");
  assert.equal(runContext(fixture({ status: "Status: pr-ready", sections })), 1);
});

test("context: rejects pr-ready while verification is red", () => {
  const sections = PR_READY_SECTIONS.replace("— green", "— red: 2 failing in payments");
  assert.equal(runContext(fixture({ status: "Status: pr-ready", sections })), 1);
});

test("context: accepts pr-ready with both anchors present and green", () => {
  assert.equal(runContext(fixture({ status: "Status: pr-ready", sections: PR_READY_SECTIONS })), 0);
});

test("context: accepts the two parked statuses", () => {
  for (const status of ["blocked", "abandoned"]) {
    assert.equal(runContext(fixture({ status: `Status: ${status}` })), 0, `${status} should pass`);
  }
});

test("context: lets a parked story have no tasks yet", () => {
  // A story can be blocked or dropped during planning, before any breakdown —
  // the empty-checklist rule must not fire on those.
  const sections = "## Original Story\nx\n\n## Understanding Summary\nx\n\n## Task Checklist\n";
  for (const status of ["blocked", "abandoned"]) {
    assert.equal(runContext(fixture({ status: `Status: ${status}`, sections })), 0, `${status} should pass`);
  }
});

test("context: done inherits pr-ready's anchors", () => {
  assert.equal(runContext(fixture({ status: "Status: done", sections: PR_READY_SECTIONS })), 0);
  const noRun = PR_READY_SECTIONS.replace("## Verification\nLast run: 2026-08-27 — `npm test` — green", "## Verification");
  assert.equal(runContext(fixture({ status: "Status: done", sections: noRun })), 1);
});

test("context: rejects a non-ISO date on an anchored line", () => {
  const sections = PR_READY_SECTIONS.replace("Last drafted: 2026-08-27", "Last drafted: 08/27/2026");
  assert.equal(runContext(fixture({ status: "Status: pr-ready", sections })), 1);
});

test("context: rejects a non-ISO date on the verification line", () => {
  const sections = PR_READY_SECTIONS.replace("Last run: 2026-08-27", "Last run: 27-Aug-2026");
  assert.equal(runContext(fixture({ status: "Status: pr-ready", sections })), 1);
});

test("context: a Branch line is optional (no git repo)", () => {
  assert.equal(runContext(fixture({ branch: "" })), 0);
});
