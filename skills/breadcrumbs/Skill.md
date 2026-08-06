---
name: breadcrumbs
description: Run a user story from a pasted ticket all the way to a PR-ready implementation through four gated steps — clarify, plan, implement, PR — while keeping a persistent context file so the work can resume in a different session or even a different AI platform without losing decisions, assumptions, or progress. Use this whenever a user pastes a user story, ticket, or feature request and wants it implemented, whenever they say "continue" or "resume" on an existing story, whenever scope changes or a test fails mid-implementation and the story needs to be reworked, and whenever they ask for a PR or PR summary. Also trigger if the user says a story got too big to explain, or asks why a past decision was made. Works alongside the ponytail skill for the implementation step.
license: MIT
---

## Core Philosophy

A user story rarely survives contact with reality unchanged — assumptions get filled in, owners clarify things later, tests surface edge cases, scope grows. None of that is a problem by itself. The problem is when it happens across many disconnected rounds and nobody — including a future Claude session, or a different AI entirely — can reconstruct what was decided, why, or what's actually left to do.

This skill runs the work through four gates (Understand → Plan → Implement → PR), confirming with the user at each gate, and keeps everything in one persistent, resumable file so the next session can pick up mid-story like nothing was lost.

## The context file

**Location:** `.claude/context/<story-slug>.md` in the repo root, where `<story-slug>` is a short kebab-case id derived from the ticket ID or title.

**Not committed.** On first use, check `.gitignore` for `.claude/context/` (or a broader `.claude/` entry) and add it if missing. This file is working memory for the story, not a project artifact — it has no reason to exist once the PR is merged.

**Resuming:** at the start of any story-related work, check whether a context file for it already exists before doing anything else. If it does, read it, summarize the current status back to the user ("Here's where this stood: ... currently at Step X"), and resume from there instead of restarting. This is what makes cross-session and cross-platform resume work — any Claude reading this file has everything it needs.

**Cleanup:** once the user confirms the PR is merged, offer to delete the context file. Don't delete it unprompted.

### File structure

```markdown
# <Story title / ticket ID>
Status: understanding | planning | implementing | pr-ready | done

## Original Story
<verbatim paste>

## Understanding Summary
<Claude's restated understanding, confirmed by user on <date>>

## Clarifying Q&A
- Q: ... — A: ...

## Assumptions
- <assumption> — reason: <why> — status: unconfirmed | confirmed by <who> on <date>

## Plan
<approach discussion, HLD/LLD notes, agreed on <date>>

## Task Checklist
- [x] Task 1 — <short description> — files: <list>
- [ ] Task 2 — ...

## Task Log
### Task 1 — <date>
- What: <what was implemented>
- Why: <reasoning / decisions made>

## Scope Changes / Reimplementation
- <date>: <trigger — test failure, owner feedback, scope change> — <what changed>

## PR Summary (draft)
<generated at Step 4>
```

Append, never overwrite. Update the `Status` line and Task Checklist checkboxes as you go — that's what tells a resuming session exactly where things stand.

## The four steps

### Step 1 — Understand & Clarify

1. Read the story. **State back what you understand first** — in your own words, before asking anything. This surfaces most misunderstandings without needing a question.
2. Only then ask follow-up questions, and only about what's genuinely vague or ambiguous — not everything that could theoretically be asked.
3. If the user can't answer something either (owner isn't available, genuinely undecided), don't block — log it under Assumptions with your reasoning and mark it `unconfirmed`. Tell the user it'll need confirming with the story owner before it's final, but proceed.
4. Write the Understanding Summary to the context file.
5. **Gate:** present the summary and stop. Do not move to planning until the user explicitly confirms it's right.

### Step 2 — Plan

1. With the confirmed understanding, discuss the implementation approach with the user — system design level: what changes, where, and why this approach over alternatives. For anything nontrivial, sketch HLD (components, data flow, integration points) and LLD (key functions/classes, schema changes) enough to break work into tasks — this doesn't need to be a formal document, just enough that both of you agree on the shape before code gets written.
2. Once the approach is agreed, break it into small tasks. Each task should be scoped tightly enough to implement and explain in one pass — note which files it touches.
3. Write the Plan and Task Checklist to the context file.
4. **Gate:** present the plan and task breakdown, stop, and wait for explicit confirmation before implementing.

### Step 3 — Implement

1. Work through the Task Checklist one task at a time.
2. **Don't ask the user mid-task.** Make the calls that are needed — use best judgment, and if a call is genuinely a judgment decision (not just mechanical), log it in the Task Log as part of that task's "Why." If something comes up that's not a coding judgment call but changes what was agreed (contradicts the plan, requires a scope decision), that's not a decision to make alone — log it under Scope Changes and flag it to the user immediately rather than pushing through silently.
3. Apply the `ponytail` skill for how code gets written during this step — simplest thing that works, standard library and existing dependencies before new code, no unrequested abstractions. Its usual exceptions still apply here too: never simplify away input validation, error handling, security, or accessibility.
4. After each task: tell the user what was done and why, check off the task, and append a Task Log entry — then move to the next task without waiting for a response, unless the user interjects.
5. If a test fails, the owner clarifies something that invalidates an assumption, or scope changes mid-flight: treat it as a fresh mini-cycle — log the trigger under Scope Changes, update the relevant Assumptions/Plan sections, adjust the Task Checklist (add/modify tasks) rather than starting a new file, and continue.
6. **Gate:** once every task is checked off, summarize what was built and stop — wait for confirmation before moving to PR.

### Step 4 — PR

1. Tell the user the work is ready for a PR.
2. Draft a PR summary written for the *reviewer*, pulled from the context file — not a diff description:
   - What the story asked for and what was built
   - Key decisions and why (from Task Log "Why" entries — this is what saves a reviewer from having to ask)
   - Assumptions made, and their confirmation status
   - If this is a later PR update on the same story: what changed since the last PR and the trigger for it
3. Write it into the PR Summary section of the context file.
4. **Gate:** show the draft, stop, and let the user confirm or adjust before treating it as final.

## What NOT to do

- Don't skip a gate, even if the next step seems obvious.
- Don't ask the user questions during Step 3 task execution — decide, log, move on. Scope-changing issues are the exception: surface those immediately.
- Don't overwrite past context file entries — this is a running record, not a snapshot.
- Don't commit the context file or reference it in the PR diff.
- Don't delete the context file unless the user confirms the PR merged.
