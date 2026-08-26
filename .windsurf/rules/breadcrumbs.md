---
trigger: model_decision
description: Run a user story from a pasted ticket all the way to a PR-ready implementation through four gated steps — clarify, plan, implement, PR — while keeping a persistent context file so the work can resume in a different session or even a different AI platform without losing decisions, assumptions, or progress. Use this whenever a user pastes a user story, ticket, or feature request and wants it implemented, whenever they say "continue" or "resume" on an existing story, whenever scope changes or a test fails mid-implementation and the story needs to be reworked, and whenever they ask for a PR or PR summary. Also trigger if the user says a story got too big to explain, or asks why a past decision was made. Works alongside the ponytail skill for the implementation step.
---

<!-- GENERATED from skills/breadcrumbs/Skill.md by scripts/build-platforms.mjs — edit the source, then re-run the script. -->

# breadcrumbs

Before acting on a user story, ticket, or a "continue"/"resume" request, read AGENTS.md at the repo root in full and follow it exactly. It has the complete four-gate workflow (Understand, Plan, Implement, PR), the context-file triggers, lite mode, and the guardrails under "What NOT to do" — this rule is intentionally short (Windsurf truncates long rule files) and is not a substitute for it.
