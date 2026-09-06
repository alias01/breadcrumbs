# Rationale — why the rules say what they say

Not loaded at runtime. `build-platforms.mjs` does not copy this file; it exists so the step files can stay terse without losing the reasoning. Add a heading here whenever a rule's "why" would otherwise bloat the rule.

## Step 3.1 — zero chat per task
Narration is deferred to a *review*, not a report. Point 8 presents the whole task list against the still-uncommitted diff, which is where "what changed and why" lets the user catch deviation — not scattered across turns they'd have to reconcile with a diff later, and not after it's locked into history. The US-16 run (2026-09-06) read this rule and still emitted "Task N verified — moving to N+1" seven times: habit beats a rule buried in a long paragraph, and point 4's "say so" read as "say it in chat". Hence the one-line destination rule at the top of 4 and the self-check at 8.

## SKILL.md — subagents are not a retrieval path
US-16's Step 1 delegated six "where is X" questions to an agent. It started cold, called a Nuxt app "React/Vite", did ~20 lookups off the books (marker said ×1), and Step 2 re-read every file it cited. Twice the cost, worse facts, cap made fictional. The narrow exception (unknown naming, repo-wide sweep) is the only case native search can't phrase.

## SKILL.md — every content-opening call counts
Same run: nine `sed`/`grep` calls between the Step 1 and Step 2 gates, marker reported ×3. A cap that isn't counted honestly bounds nothing.

## SKILL.md — one turn, many calls / trim output
Cost = turns × context size. US-16: 209 turns at ~116k average context ≈ 4.8M effective tokens. Nine sequential reads that could have been two turns; `prisma migrate diff` help dumped three times and a minified Prisma error dumped whole around turn 60, then re-read ~150 times.

## SKILL.md — long story checkpoint + /compact
Step 3 is the longest phase and carries all Step 1/2 investigation for 60+ turns. Once the plan is confirmed the context file holds everything Step 3 needs; compacting there roughly halves per-turn context for the rest of the story. Trigger is ≥4 tasks in full mode so lite and short stories keep the stateless path.

## Step 1 — layman register
The Understanding gate exists for the story's owner to confirm. A summary in symbol names and line refs can't be confirmed by a PO, so it fails the gate's purpose even when accurate. Technical depth belongs at Step 2 where the reader is the implementer.

## Step 1 — coupled questions in one numbered message
US-16 asked "transport *and* persistence" as two prose paragraphs in one turn; the user answered "s", then "a". Independent unknowns stay one-per-turn; coupled ones are fine together only when each part is separately answerable with a token.

## Step 3.4 — manual E2E as one script, port check, --help once
US-16's manual pass was ~35 turns of single `curl`s, three `EADDRINUSE` server starts and two frontend restarts, plus three guessed flag spellings. One script, one `lsof`, one `--help | grep` — about five turns.

## Step 3.4 — touched spec per task, full suite once
Full backend suite ran three times and vitest four in US-16. Per-task isolation proof needs only the touched spec; composition proof is point 8's job.
