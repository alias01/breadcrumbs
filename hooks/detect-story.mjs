#!/usr/bin/env node
// UserPromptSubmit hook: nudges Claude toward the breadcrumbs skill when a
// prompt looks like a pasted ticket/story, instead of relying on the user
// (or Claude) to remember to invoke it explicitly.

// Split into named patterns so a miss is traceable to one rule rather than a
// single unreadable alternation. Any hit fires the nudge.
const TRIGGERS = [
  // Explicit story/ticket vocabulary.
  /\b(user story|as an? (user|admin|customer)|acceptance criteria|given\/when\/then)\b/i,
  // Tracker references: "jira", "ticket #12", "issue #12".
  /\b(jira|linear\.app|ticket\s*#?\d+|issue\s*#\d+)\b/i,
  // Bare issue keys (PARK-482, ABC-1). Only counted where a pasted ticket
  // actually puts them — at the start of a line, right after tracker
  // vocabulary, or followed by a colon — so `UTF-8` and `RFC-7231` in running
  // prose stay quiet. Standards prefixes are denied outright for the case
  // where one does open a line.
  /(?:^|\n|\b(?:ticket|issue|story|fixes|closes|see)\s+)(?!UTF-|SHA-|MD-|ISO-|RFC-|AES-|RSA-|IPV-|HTTP-)[A-Z][A-Z0-9]{1,9}-\d{1,6}\b/im,
  /\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\s*:/,
  // Resuming existing work.
  /\b(continue|resume|pick(ing)? back up|carry on)\b.{0,30}\b(story|ticket|task|feature|work)\b/i,
  // Feature-request phrasing: an imperative build verb aimed at a deliverable.
  // Deliberately requires both halves — "add a note" shouldn't fire, "add a
  // CSV export button to the reports page" should.
  /\b(add|implement|build|create|introduce|support|wire up)\b.{0,60}\b(button|page|screen|endpoint|api|route|form|flow|field|column|filter|export|import|toggle|setting|feature|integration|webhook|migration|dashboard|report|modal|component)\b/i,
  // Bug reports stated as expected-vs-actual.
  /\b(should (be|do|show|return|have)\b.{0,40}\bbut\b|steps to reproduce|repro steps|expected:.{0,40}actual:)/i,
];

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let prompt = "";
  try {
    prompt = JSON.parse(input).prompt ?? "";
  } catch {
    prompt = input;
  }

  if (TRIGGERS.some((re) => re.test(prompt))) {
    console.log(
      "This looks like a user story/ticket. Before proceeding, check for an existing context file under .breadcrumbs/context/ and follow the breadcrumbs skill (SKILL.md) — Understand, Plan, Implement, PR, with a gate at each step."
    );
  }
  process.exit(0);
});
