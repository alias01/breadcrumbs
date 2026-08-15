#!/usr/bin/env node
// UserPromptSubmit hook: nudges Claude toward the breadcrumbs skill when a
// prompt looks like a pasted ticket/story, instead of relying on the user
// (or Claude) to remember to invoke it explicitly.

const TRIGGER = /\b(user story|as a user|acceptance criteria|jira|ticket #?\d|continue.{0,20}(story|ticket)|resume.{0,20}(story|ticket))\b/i;

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let prompt = "";
  try {
    prompt = JSON.parse(input).prompt ?? "";
  } catch {
    prompt = input;
  }

  if (TRIGGER.test(prompt)) {
    console.log(
      "This looks like a user story/ticket. Before proceeding, check for an existing context file under .breadcrumbs/context/ and follow the breadcrumbs skill (skills/breadcrumbs/Skill.md) — Understand, Plan, Implement, PR, with a gate at each step."
    );
  }
  process.exit(0);
});
