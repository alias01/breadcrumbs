<!-- GENERATED from skills/breadcrumbs/SKILL.md by scripts/build-platforms.mjs — edit the source, then re-run the script. -->

# breadcrumbs

## Core Philosophy

Four gates (Understand → Plan → Implement → PR), each confirmed, backed by one file so any session resumes mid-story. Reasoning logged when decided, never reconstructed.

## Communication style

Chat: terse fragments. Senior audience → jargon, no hedging, no restating, no narration. Expand only if asked. **Exception:** Step 1's summary and questions are plain product language (`step1-understand.md` 1).

## Investigation scope

Search outward from the story's own terms (feature, endpoint, table, component, error) — never a repo survey.

**One retrieval path per question:**
- "Where is X / what does this do" → native code search (semantic index or grep). Open only the file it points at.
- "What relates to what" (Step 1 dependencies, Step 2 Flow) → `graphify` `query`/`path`/`explain`, only if `graphify-out/` exists — never build mid-story. No graph → follow imports by hand.
- **Subagents:** only a repo-wide "anything like X?" sweep, name unknown — ≤1/story, Explore, read-only, leads to re-check, not gate facts. Shown as `agent ×1`, counts toward the cap.

**Cost = turns × context.**
- Independent lookups → parallel, one turn. `sleep; tail` → one command. File tail → `wc -l` + `sed -n`; full reads last resort.
- Trim output: `| tail -5`, `--loglevel=error`, server start → `grep -Ei "started|local:|ready|EADDRINUSE|error"`, `git rev-list --count` over `git log`. Quote globs (`--include='*.tsx'`).
- **Redundant call guard:** fact already established this story (file unchanged since read, suite green since last change, question answered) → cite it, don't re-fetch. A repeat with no new signal is a failure.
- **Checkpoint, any phase:** ~25 tool calls since the last checkpoint (file created, `/compact`, story start), no gate near → stop, suggest `/compact`; no file → create first (Stop signal). Independent of 3.0/3.8 triggers.

**Caps — counted, not felt.** Native lookups ≤8 before the Step 1 gate, ≤4 more before Step 2. Graph ≤2/story, both at Step 2, `--budget 1500`; lite → 0. Never open `GRAPH_REPORT.md` or raw graph JSON. Cap hit, question open → ask. Stop once Step 1's taxonomy is answered / Step 2's Flow known.

**Investigation marker** before every gate: `[investigation: native search ×3 · graph ×0]`. Every content-opening call counts (grep, sed -n, cat, find, Read). Undercounting is worse than over-cap. Lite showing `graph ×1`, or any gate over cap → stop, say why.

## The context file

**Created only on trigger:**
- **Stop signal** ("pause here", "continue tomorrow") → create, backfill at the current step.
- **Mid-flight break** (test fails, assumption breaks, scope changes, scale regression — 3.7) → create if missing, backfill, log the Scope Change. Lite escalates to full.
- **Topic shift**, no stop signal → ask once: "Moving off this story — checkpoint it first?" Yes → Stop signal. No → don't re-ask.
- **Long story** — full mode, ≥4 tasks → 3.0 creates it, asks for `/compact`.
- **Step command** — `bc understand` / `plan` / `build` always write it (next may be a fresh session).

No trigger → no file. **Trip marker** before the gate message when written: `[context file: wrote Understanding Summary + Assumptions]`.

**Resuming** (story start, "continue"/"resume") → list `.breadcrumbs/context/` (repo root): empty → stateless, files → `resume.md`.

**Mechanics** (location, exclusion, cleanup, validators): `context-file-mechanics.md`, once at first trigger. **Structure:** `context-template.md`, once at first creation. Neither on resume. **Constitution** — optional committed `.breadcrumbs/constitution.md`, standing repo-wide rules; checked at 2.8 or the lite gate (`context-file-mechanics.md`).

## Lite mode

`Bug fix` / `Copy/config/content change` (1.4) → lite; else full.
- Step 1 gate + Step 2 = one message: approach + tasks (≤2) + proving check + `Scale target:`, ending "Here's what I understand and how I'd build it — confirm?" → Step 3. Bug fix adds root cause, repro confirmed, same defect elsewhere, regression case; either type → constitution check.
- Step 3: commit as you go, one wrap-up, no pre-commit review. Verification not collapsed — 3.4 per task, 3.8 before wrap-up.
- Mid-flight break escalates to full, said in one line.

## The four steps

Read the step file at its gate — don't preload.

| Step | File | Gate |
|---|---|---|
| 1 — Understand | `step1-understand.md` | Understanding + Assumptions confirmed (zero Material unknowns → folds into 2) |
| 2 — Plan | `step2-plan.md` | Plan + tasks confirmed (lite: skipped) |
| 3 — Implement | `step3-implement.md` | All tasks verified, tests green, reviewed *before* any commit |
| 4 — PR | `step4-pr.md` | PR draft confirmed in chat |

**Every story:** red before code (3.4). BE+FE → task 1 = contract: committed fixture both smoke tests import (2.6).

## Step commands

`/breadcrumbs` runs all four. Each step also has a command: one step, never auto-advances; names the next only once its own gate is answered — running it *is* the confirmation. `/bc-plan` (Claude Code, Cursor, Windsurf), `/bc:plan` (Gemini), else say "bc plan".

| Command | Runs | Needs | Next |
|---|---|---|---|
| `bc understand` | Step 1 + file | — | `bc plan` (lite: `bc build`) |
| `bc plan` | Step 2 + file | confirmed Understanding | `bc build` |
| `bc build` | 3.0–3.7 + file, no commits | Plan + Checklist | `bc review` (lite: `bc pr`) |
| `bc review` | 3.8 gate | all tasks ticked | `bc pr` |
| `bc pr` | Step 4 | story commits (non-breadcrumbs branch ok) | — |

Also: `bc resume` → `resume.md` · `bc status` → one line (story, step, next), no lookups/write · `bc pause` → Stop signal + `/compact` · `bc why <x>` → quote the log entry · `bc rule <text>` → constitution append. **Needs** from file, else conversation; missing → one line naming the producing command; proceed only on explicit "go" (= gate waiver).

## What NOT to do

Never skip a gate on your own initiative, lite included. **User override:** only an explicit ask waives a gate ("just build it", "don't ask between tasks") — never inferred from terseness or a fast "yes". Say in one line which gate was waived; file exists → `Gate Waivers`. That gate, this story only.

---

# Context file mechanics

Read once, at the first creation trigger. Resume rules: `resume.md`.

**Location:** `.breadcrumbs/context/<story-slug>.md`, slug = short kebab-case from ticket ID/title. Anchored at the repo root (`git rev-parse --show-toplevel`; no git → nearest project-root marker, else cwd, say which). Never resolve against a subdirectory or home; never store absolute paths in the file — everything repo-relative.

**Not committed.** On creation, exclude via `.git/info/exclude` (not `.gitignore`): already excluded → nothing; else append `.breadcrumbs/context/` silently; no `.git/` → skip. User wants it shared → move to `.gitignore` then.

**Growth:** Scope Changes / Q&A are uncapped append-only. Count looks like the task-cap problem → flag, consider splitting the story.

**Cleanup:** PR merged (user-confirmed) → offer to delete. Never unprompted.

**Writes:** one per gate, all sections batched, no read-then-write, no re-read to confirm.

**Validation:** after a gate write (not Task Log appends) → `validate-context-file.mjs <path>`: Status line, required sections, checkboxes. Not found → skip.

## Project constitution

Standing repo-wide rules for every story ("no PII in logs"). Committed, never deleted. `.breadcrumbs/constitution.md`, one rule per line:

```
- <rule> — rationale: <why> — added <date> — status: active
- … — status: superseded by "<rule>" on <date>
- … — status: retired on <date> — reason: <why>
```

Append-only; only `status:` amended. **Retire** only on explicit user instruction; replacement → new active line same pass. Never retire because a plan is inconvenient; a one-off deviation is a Scope Change or Assumption. **Read** `status: active` lines only, once per story (Step 2.8 or lite gate). **Contradiction:** new rule vs active one → surface both, ask, then append new + flip old.

**Created only when earned**, via one ask ("save that as a standing project rule?"): user states a repo-wide rule; hand-edit reading as a general preference (3.5); the same correction twice, or once in repo-wide terms. Declined → this story's Assumptions, don't re-ask. Bar: repo-wide *and* standing.

## Validator scripts

`validate-context-file.mjs`, `validate-commit-message.mjs` (3.6), `session-token-stats.mjs` (4.8). Resolve `scripts/<name>.mjs` relative to, in order: the directory this file loaded from → `skills/breadcrumbs/` → `.claude/skills/breadcrumbs/` → `~/.claude/skills/breadcrumbs/`. First hit, `node <path> [args]`, once per session. None → by-hand equivalent, never block.

---

# Step 1 — Understand & Clarify

1. Read the story. **State back your understanding first**, own words, before asking anything. Look-ups scoped per `SKILL.md` Investigation scope.

   **Layman register — this step only.** Summary and questions read as the story's owner would say them: who does what, what they see, what changes, what stays. Look-ups feed the content (what exists, what this touches, where story and code disagree); wording stays plain — "the screen where a driver picks a slot", not `SlotPickerView`. Symbols, paths, tables, endpoints only if the story or user uses them. The taxonomy below is your scan list, not the summary's vocabulary. Test: the story's author could confirm it line by line.
2. Then follow-ups, only on what's genuinely vague. Scan this taxonomy; skip what doesn't apply:
   - Who/what/why: specific persona, goal, why it matters
   - Scope: in, out, one story or several
   - Acceptance criteria: testable "done", happy path, demo scenario
   - Dependencies: other stories/APIs/systems, mockups, what this blocks
   - Data model/schema, source of truth, existing data
   - API/contract boundaries; BE+FE → ask what the screen shows
   - Auth/permissions
   - Error handling & edge cases: error/loading/empty states, empty input, network failure, denied
   - **Scale target:** volume, rate, latency budget. Stated → record verbatim. Silent → Material only if the change sits on a data- or request-dependent path; else Cosmetic → "none stated — current scale assumed", logged per 3. Not knowing is the failure. Step 2 sizes against it, Step 3.4 judges the diff by it.
   - Security/compliance, device/platform
   - i18n/locale
   - Backward compatibility
   - Existing pattern or net-new

   **One question per message**, wait for the answer. Independent unknowns never share a message. **Coupled** sub-questions (one answer constrains the other) go together, each part answerable alone:

   ```
   Two linked decisions:
   1. <part one> — options: (a) … (b) …
   2. <part two> — depends on 1: if (a) then …
   My pick: 1a, 2 yes — because <one line>. Reply "ok", or "1b" / "2 no".
   ```

   Plain chat text, not a question widget — a widget only for 3+ distinct options worth comparing side by side.

   **Ask order + stop rule:** classify first (point 5), Material before Cosmetic; Cosmetic → assume and log. Stop when the story is buildable and every gap is Cosmetic or safely assumable → rest to Assumptions as `unconfirmed`. Soft ceiling ~5 questions; hit it with Material open → stop anyway, log `unconfirmed`. Either stop → one line before the gate: `Stopping questions here — assuming <X>, <Y> (logged unconfirmed). Flag if wrong.`
3. User can't answer → don't block. Log under Assumptions with reasoning, `unconfirmed`, say it needs owner confirmation, proceed.
4. Classify: `Bug fix` / `Copy/config/content change` (**lite**) / `Small feature addition` / `Refactor/tech debt` / `New feature/subsystem` / `New service/integration` / `Performance/optimization` (**full**; depth in Step 2.1). State the mode, one line.
5. **Tag every open question/assumption:** Cosmetic (naming, location, formatting — wrong guess costs nothing) or Material (data model, contract, business logic, security, user-visible behavior — wrong guess = rework). Tag count, not type or size, decides the gate.
6. **Gate:** investigation marker; file exists → write Understanding Summary + Assumptions in one pass, trip marker; else same content in chat. Summary always ends with one `Scale target:` line.
   - **Zero Material unknowns** → fold Step 2 in: **read `step2-plan.md`**, do its work silently, present Summary + Plan, one confirmation.
   - **Any Material unknown** (even `unconfirmed`) → summary alone, stop. No Step 2 until confirmed.

---

# Step 2 — Plan

*Lite skips this step.* Zero Material unknowns → folded into 1.6.

3-5 (anything adding work) run before 6, so tasks are cut once and 7's cap sees the real list.

1. Classify from the confirmed summary (lite types: done at 1.4). Ask only if genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | "should do Y but does Z" | Root cause + fix, no HLD/LLD |
   | Copy/config/content change | text, labels, flags, constants | No design |
   | Small feature addition | new behavior, existing architecture | LLD only |
   | Refactor/tech debt | no behavior change | LLD, restructured part only |
   | New feature/subsystem | new capability spanning components | Full HLD + LLD |
   | New service/integration | new external dependency / cross-system flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resources, scaling | Profiling + targeted fix |

   Type = kind, not size; 7 catches overgrowth.

2. Approach at that depth, starting *from* the summary, never restating it. HLD → components, data flow, integration points. LLD → key functions/classes/schema. No design → the fix in 1-2 sentences.
   - **Tripwire:** Material unknown Step 1 missed → stop, ask or log `unconfirmed` (1.3). Applies when 1+2 merged.
   - **Architecture decisions:** 2+ valid approaches → pick one, say why, write it down. BE+FE story → **contract-first** (6).
   - **Risks:** *implementation* risk — unfamiliar code, needs a spike, may break behavior. Open → tripwire. Recorded (9).

**Depth gate for 3-5:**

| Depth | 3-5 |
|---|---|
| No design | Skip 3, 4 — one regression case. 5 only for prod data/payments/migration. |
| LLD only | 3: the one domain, folded into 2. 4: one line. 5: only schema/prod-data/payments. |
| Full HLD + LLD | All three. |

Light label, real risk (small feature + migration) → risk decides.

3. **Domain checks** — orthogonal to type; skip untouched domains. Findings → 2, work → 6. **No re-asking:** auth, errors, compat, scale were scanned in Step 1 — check against the *plan* silently; questions only via the tripwire.

   **Scale target check** — full mode, one fragment: walk data-/request-dependent paths against Step 1's target. Holds → say how ("paginated, indexed on `user_id`"). Doesn't / can't tell → tripwire: change approach or log open risk. "Current scale assumed" → nothing worse than today.

   | Domain | Checks |
   |---|---|
   | API/backend | Contract (fields, types, status codes) → 2; auth; rate limits; idempotency; versioning; load if design-relevant |
   | Mobile app | Offline; iOS vs Android; store review; battery/data |
   | Database/schema | Migration backward-compatible + reversible → 5; existing queries/indexes; backfill; volume at target |
   | Bug fix (escalated) | Root cause not symptom; repro; same defect elsewhere; regression test → 4 |
   | Infra/DevOps | Downtime; monitoring new failure modes; cost; scripted not manual |
   | Data pipeline/ETL | Source format; mid-batch failure; reprocessing; downstream consumers |
   | Third-party integration | Rate limits/pricing; downtime; credentials; webhook vs polling |
   | UI-only/design | Responsive; a11y (contrast, keyboard, screen reader); design-system reuse |

4. **Testing plan — minimal, test-first** (`step3-implement.md` 4). One smoke case per thing touched: backend endpoint → happy path, status + shape vs contract fixture (error case only if named) · frontend screen → renders fixture data, key element visible · bug fix → regression, red on unfixed code · refactor → characterization, green on current code, first · copy/config → one assertion on the new value.

   Plus how acceptance criteria get verified. Substantial test work → own task. Scale target measurable (benchmark, query plan, timing) → one case names it; else say so — 3.4's scan is the only check.

   **Listed to be run, not filed.** Each case: what runs, what passing looks like, which task(s). Case with no task → missing task; task with no case → weaker repo-check verdict at 3.4 — decide now if acceptable.

5. **Rollout & rollback** — only prod data, payments, migration/compat: flag?, migration, rollback plan. Flag/migration/backfill work = tasks, not footnotes.

6. Break into tasks along seams: dependency order, then layer (FE/BE/data/integration, touched only) or module. Right size = one What + one Why, ≤3 files; else split. **BE+FE story → task 1 is the contract** (below). Nothing appended after 7.
   - **Flow:** ordered file/module list across tasks. Fixed here; changes only via Scope Change.
   - **Sequencing:** independent tasks; smallest demoable slice. Recorded (9).
   - **Contract-first:** task 1 = request/response/error shapes where shared types live (workspace pkg, OpenAPI, zod; none → skip types) + **one committed fixture file** (`fixtures/<name>.json`), not inline data. No logic, own commit. Then BE tasks (smoke test *imports* the fixture, asserts against it), then FE tasks (smoke test renders *that import*) — fixture = drift detector. Frozen after task 1; change → Scope Change, re-run both. Counts toward 7. One-sided → skip.

7. Task cap by type — ceiling, applied to the finished list:

   | Type | Max | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — misclassified? |
   | Small feature | 5 | reconsider — maybe new feature |
   | Refactor | 8 | upper bound |
   | New feature / service | 10 | **stop, flag** — propose split before Step 3 |
   | Performance | 5 | several bottlenecks → split |

   Flow near ~30 files → flag, propose split. "Small feature" past ~8 files → likely misclassified.

8. **Constitution:** `.breadcrumbs/constitution.md` exists → read once, check the plan against `status: active` lines. Conflict → tripwire.

9. File exists → one write: type, depth, design notes, decisions, Risks, domain/scale outcomes, testing plan, rollout, Flow, Sequencing, Checklist — where applied.
10. **Gate:** investigation marker, trip marker if written. Plan + tasks verbatim; summary not re-quoted unless folded 1.6 gate. Stop for confirmation (`step3-implement.md`).

---

# Step 3 — Implement

0. **Before task 1.**
   - **Branch:** `git branch --show-current`. Not `feature/<slug>` → `git checkout -b feature/<slug>` from the default branch (from current only if this story depends on it unmerged — say so; Step 4 Dependencies names the base). One line: `On feature/<slug> (from main)`. Never commit onto another story's branch.
   - **Checkpoint:** full mode, ≥4 tasks → read `context-file-mechanics.md` + `context-template.md`, create the file (Original Story, Understanding, Assumptions, Plan, Flow, Checklist), trip marker, stop: `Plan saved to .breadcrumbs/context/<slug>.md — run /compact now; I'll resume from the file.` Next message isn't a compaction → `Not compacted — continuing at ~<N>k context`, proceed, don't re-ask. After compact the file is the whole state; don't re-read the transcript. <4 tasks or lite → skip.
1. One task at a time. **No text-only turns** between the first edit and the gate: every message carries a tool call. Only allowed text: `✓ Task N — <verdict, ≤8 words>`, *in the same message* as the next task's first call — sent alone, it is the violation. No "starting N", "good —". Text with no tool call = a point-7 break, nothing else. Nothing committed (6). Re-read this point before the first edit.
2. **Don't ask mid-task.** Judgment call → Task Log "Why". Contradicts the plan / needs a scope decision → Scope Changes, flag now.
3. `ponytail`: simplest thing that works, existing deps first, no unrequested abstractions. Never simplify away validation, error handling, security, accessibility, or the scale target — "works" means at that scale.
4. **Test first, verify before checkoff.** Done = something demonstrates it. **Every verdict → Task Log or held note, never chat.**
   - **Red first — every task, lite included.** Before any implementation edit: write the 2.4 smoke test, run it, confirm it fails *for the expected reason* (missing route/element, wrong value — not syntax/import/setup). → `Red: <repo-relative test path> › <name> — <failure>` (freeze hook reads it). Bug fix: red on unfixed code. Refactor: characterization test *green* on current code, own first task (`Red: n/a — characterization`). Nothing executable (docs) → `Red: n/a — <why>`. Contract task (2.6): fixture file committed alone, `Red: n/a — contract`; BE/FE smoke not importing it = no checkoff.
   - **Frozen after red:** its assertions and the contract fixture (2.6) are fixed for the story; changing them = 7 Scope Change, never silent. Setup plumbing may change. Opt-in hook: `hooks/freeze-tests.mjs`.
   - **Green:** implement until it passes — exit code + stderr, not a printed summary.
   - Run the 2.4 cases mapped to this task (lite → the named check). None mapped → repo fast checks over what you touched, name which. **Per task: the touched spec only.** Full suite once, at 8.
   - Nothing executable → say so + what was inspected; silence isn't a verdict. Fails → fix, re-run; cause is the plan → 7.
   - **Self-review:** diff vs the task's Why — scaffolding, TODO-as-fix, workaround where root cause was the point, unasked abstraction. A smoke test that passes with the feature deleted doesn't count. Fix now.
   - **Scale scan:** per-item query on a growing collection, unbounded load, new query without pagination/index, sync work on a hot path. Trivial → fix, note in `Verified:`. Not trivial or target can't hold → not a checkoff, 7.
   - **UI change → look at it** (Claude Browser, `run` skill, simulator — check the tool list before claiming none); SSR grep is the fallback, said as such.
   - **Dev servers:** `lsof -i :<port>` first; taken → **never kill it** (the user's), use a free port, client env in the same command. Log via `grep -Ei "started|local:|ready|EADDRINUSE|error"`.
   - **Manual E2E → one script per story**, in the repo's package dir, env loaded as the repo's config does (`import 'dotenv/config'` if `prisma.config.ts` does), one function per scenario, run once, prints only asserted fields, cleans up, deleted after. New scenario = edit that file. Never one `curl` per turn.
   - **CLI usage error** → `<cmd> --help | grep <flag>` once, then the fixed call.
   - Outcome → `Verified:` (what ran, what it showed). Step 4's Test section comes only from this.
5. **Manual-edit review** — before each task and on resume: `git status` / `git diff HEAD` over the story's files. A change you didn't make → one-line `Check:` (correct, or issue: what/where). File off the Flow (2.6) → say so, non-blocking. Review, not veto: the edit stands unless it breaks something.

   After each task: file exists → append Task Log entry with `Red:` + `Verified:`, tick the box, one write, trip marker. Forms (`context-template.md`): judgment call → What/Why block; mechanical → one line; hand-edit → line + `Check:` (+ `Flow:` if off-plan). No file → hold the same as a private note for 8. Nothing sent to the user now.

   **Learning from the edit:** hand-edit or correction that reads repo-wide ("we never do X here") → ask once: "Save that as a standing project rule?" Yes → append to `.breadcrumbs/constitution.md`, apply from the next task. No → don't re-ask for that pattern.
6. **Don't commit per task.** No `git add`/`commit` until 8's review is approved. No curiosity checks either (`git branch`, `git log`) — only calls that gate the next action.

   After approval: one commit per task, in order, mirroring the Task Log — few Bash calls, no text between commits. Conventional Commits `<type>(<scope>): <imperative summary>`; body = short bullets from What/Why. Types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `chore` `revert`. Reverting a landed task → `git revert <hash>`, header `revert(<scope>): <what was undone>`, hash + reason in body. Scope change mid-task → still one commit; type = what shipped. Check headers with `validate-commit-message.mjs -m "<header>"` (resolution: `context-file-mechanics.md`; a bare argument is read as a file path); not found → by hand.
7. Test fails / assumption invalidated / scope changes / **scale regression** → Mid-flight break (`SKILL.md`). Then: Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update Assumptions/Plan/Checklist. Scale case: tell the user before fixing — what regressed, which target, what holding it takes. Absorb or fix is their call.
8. **Gate:** all tasks ticked → **run the whole planned test set** (every 2.4 case + backend suite + frontend suite — both, even if one side changed — each named with its count) against the uncommitted tree. Any text-only turn since the first edit → admit it in one line atop the review.
   - Red → fix, re-run; cause is the plan → 7. Never present with a known-failing case.
   - Nothing runnable → say so with what was checked, continue.
   - Green → **one review message, nothing committed:** per task — name, files (`git diff --stat`), and **what to check** (the risky assumption or exact behavior, or "mechanical, low risk").
     - Approved → commit every task in order (6), then summarize what was built + what proved it (cases, scale target measured or scanned). Stop for PR confirmation (`step4-pr.md`).
     - Issue flagged → fix in place (uncommitted), re-present only the affected task(s).

   **Review round, not fix-per-message.** Question → answer inline, no edit. Change request → note it; another lands before it's applied → apply both together. A single unambiguous "fix this now" → immediately. Re-run only the specs the batch touched; full suites once more, right before approval. Re-present only what changed.

   **Review running long** (3+ fix rounds, or "pause"/"continue later") → checkpoint as 3.0: suggest `/compact`; no file → create it first, backfilled to the review state.

   Step 4 drafts from these commits; a fix after commits land is its own commit and Log entry (6's revert path).

---

# Step 4 — PR

1. Say the work is ready for a PR.
2. Title: `<Ticket ID/slug>: <imperative summary>`. Ticket has a URL → link the ID.
3. **Two readers:** today's reviewer, and whoever blames a line in months later. A section earns its place only by telling one of them what the diff can't. File exists → pull from it; else from the conversation.
   - **What** — always. The behavior change. Not the problem, not the file list. ← Task Log What.
   - **Why** — unless it restates What. Root cause/constraint + the rejected alternative, one fragment each. ← Why, Assumptions, Scope Changes.
   - **Test** — what actually ran and showed: 3.4/3.8 cases, manual steps, or "nothing runnable" + what was inspected. ← `Verified:` lines and the 3.8 run, never the Plan. Scale target: measured or only scanned.
   - **Rollback** — only if not a plain revert (migration, flag, external state, backfill).
   - **Dependencies** — only if this depends on or blocks something; `git merge-base HEAD <default>` not at tip → stacked, name the base.
   - **Reviewer focus** — only if the diff is uneven: where to read, what to skim.
   - **Out of scope** — only if a reviewer would ask "why not also…": what was left and where it went.
   - **What changed since last PR** — re-draft only. ← Scope Changes after `Last drafted:`.
4. **Shape:** one point → a sentence; two+ → bullets, one fact each, no sub-bullets. **Cap 2 bullets per section, Why 3.** Too long → compress, not truncate; can't fit → the task was too broad. Whole draft reads in 2-5 min; longer with only earned sections → story too big, say so. Never: restate the diff, narrate the journey, list commits, leave an empty heading.

   ```markdown
   ## [<Ticket ID>](<url>): <imperative summary>

   **What:** <one sentence when one point>

   **Why:**
   - <root cause / constraint>
   - <rejected alternative, if weighed>

   **Test:**
   - <case run + outcome>

   **Rollback:** <only if non-trivial>
   **Dependencies:** <only if any>
   **Reviewer focus:** <only if uneven>
   **Out of scope:** <only if something was left>
   ```
   Example: `**What:** Retries reuse one idempotency key per order, so the provider sees a single charge across the retry sequence.` / `**Why:** - Retries omitted the key; each looked like a fresh charge. - Considered local de-dup by order ID; rejected — races across workers.` / `**Reviewer focus:** \`retry.ts\` key generation is the judgment call; \`charge.ts\` only threads it through.`
5. Re-scan against 4 before showing: any section with 2+ facts in prose → bullets.
6. **Draft in chat, stop.** The message is the deliverable. Nothing written to the file.
7. **Gate:** confirm or iterate in chat.
8. **[Testing]** Run `session-token-stats.mjs --by-tool` (resolution in `context-file-mechanics.md`), show full output verbatim incl. the closing caveat. Not found → skip. Drop this step when no longer needed.
9. Confirmed + file exists → PR Summary: `Last drafted: <date>`; Status `pr-ready`; trip marker.

---

# breadcrumbs context file — template & guardrails

## Content style

AI-only reader. Fragments, no articles, abbreviate freely. `Why: race condition (two writers) — added mutex.` Markdown structure stays intact.

## File structure

```markdown
# <Story title / ticket ID>
Status: understanding | planning | implementing | pr-ready | done

## Original Story
<verbatim paste>

## Understanding Summary
<restated understanding, confirmed <date>>
Scale target: <volume / rate / latency — or "none stated — current scale assumed">

## Clarifying Q&A
- Q: ... — A: ...

## Assumptions
- <assumption> — reason: <why> — status: unconfirmed | confirmed by <who> on <date>

## Current Requirements
<what's true today, amended in place — never a history>

## Plan
Story type: <type>
<approach, HLD/LLD at applicable depth, agreed <date>>
<architecture decisions: chosen — why; rejected — why not>
<domain/scale outcomes, testing plan, rollout+rollback — those that applied>

### Risks / Unknowns
- <implementation risk> — status: open | resolved: <how>

### Sequencing
<independent tasks; smallest demoable slice. Omit if none.>

## Flow
<ordered files/modules + task numbers. Changes only via Scope Change.>

## Task Checklist
- [x] Task 1 — <desc> — files: <list>
- [ ] Task 2 — ...

## Task Log
### Task 1 — <date>
- What: ...
- Why: ...
- Red: <test path> › <name> — <failure> | n/a — <why>
- Verified: <what ran / "nothing runnable: <inspected>"> — <outcome>

### Task 2 — <date> (mechanical)
- [x] Task 2 — <desc> — files: <list>
- Red: ...
- Verified: ...

### Task 3 — <date> (manual edit, by user)
- [x] Task 3 — <desc> — files: <list>
- Check: <correct | issue — one line>
- Verified: ...
- Flow: <off plan — reason. Only if the file is off the Flow.>

## Scope Changes / Reimplementation
### <date> — <label>
- Trigger: ...
- Before: ...
- After: ...
- Affected tasks: ...
- Why: ...

## Gate Waivers
- <gate> — waived <date> — not confirmed: <what>

## PR Summary
Last drafted: <date>
```

Append, never overwrite — except `Status`, checkboxes, Current Requirements, a Risk's `status:`. `Red:` on every form but a manual edit; `Verified:` on all; "nothing runnable" is a value, absence isn't.

## What NOT to do

- No gate skipped without a waiver logged under `Gate Waivers`.
- No Step 3 questions except scope-changing ones.
- No code before `Red:`, no checkoff without `Verified:`, no frozen-test edit without a Scope Change, no Step 3 gate with a failing case.
- Never rewrite past entries, commit or cite the file in the PR, or delete it before merge confirmation.
- Lite never absorbs a scope change or failed test silently — escalate to full.

---

# Resuming a story

Read when `.breadcrumbs/context/` has files and the user starts or continues a story.

**Match:** one file clearly matching the request → read it, summarize status ("Here's where this stood: … at Step X"), pick up at the next unchecked task; don't redo gates. Ambiguous (several files, generic "continue") → list slug + first two lines each (title, `Status:`), ask which. Zero matches → stateless.

**Staleness (same scan):** any file `Status: pr-ready` with mtime >7 days → after resolving the current story, one line: "N file(s) at pr-ready 7+ days: <slugs> — merged? delete?" Delete only on confirmation.

**Chat summary compaction:** file stays full; the summary keeps full What/Why for the last 2-3 Log/Scope entries and anything open, one line (date + What) for older ones. Older decision asked about → read that entry on demand.

**Then:** Step 3.5's manual-edit review over the story's files, and read the step file for the story's current step.
