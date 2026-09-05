<!-- GENERATED from skills/breadcrumbs/SKILL.md by scripts/build-platforms.mjs — edit the source, then re-run the script. -->

# breadcrumbs

## Core Philosophy

A story never survives reality unchanged: assumptions filled in, scope grows, tests surface edge cases. What breaks is that nobody later (next session, different AI) can reconstruct what was decided, why, what's left.

Four gates (Understand → Plan → Implement → PR), each confirmed with the user, backed by one persistent file → any session resumes mid-story. Reasoning is captured at decision time (Task Log "Why", Scope Changes) — reconstructed later it's expensive and usually wrong.

## Communication style

Chat only — the context file has its own denser style (`context-template.md`). Terse, bullet/fragment, glanceable. Senior audience → jargon freely, no hedging, no restating known context, no multi-paragraph narration. Expand only if asked or confusion is signaled.

## Investigation scope

Search outward from the story's own keywords/entities (feature name, endpoint, table, component, error message) — never a full-repo read or tree survey.

**One retrieval path per question — never stack them:**
- **"Where is X / what does this file do"** (most of Step 1, all of lite) → the platform's native code search: semantic index if it has one, else grep/ripgrep. Open only the file it points at.
- **"What relates to what"** (Step 1 dependencies, Step 2 Flow / blast radius) → `graphify` `query` / `path` / `explain`, only if `graphify-out/` already exists — never build mid-story. No graph → native search, follow imports/calls by hand.

**Caps — counted, not felt.** Native lookups ≤4 before the Step 1 gate, ≤3 more before Step 2. Graph queries ≤2 per story, both at Step 2, each `--budget 1500`; lite → 0. Never open `GRAPH_REPORT.md` or the raw graph JSON. Cap hit, category still open → ask, don't keep reading. Full-file reads last resort. Stop once Step 1's taxonomy is answered or Step 2's Flow is identified; widen only for a specific remaining unknown.

**Investigation marker:** one line before every gate message counting what the gate spent: `[investigation: native search ×3 · graph ×0]`. Lite gate showing `graph ×1`, or any gate over cap → stop, say why.

## The context file

**Created only on trigger, never by default.** Every story starts stateless: gates run in chat, nothing on disk. Triggers:
- **Stop signal** — "let's continue tomorrow," "pause here" → create now, backfill Original Story/Understanding/Plan/Task Checklist from the conversation at the current step. Mode unchanged.
- **Mid-flight break** — test fails, assumption breaks, scope changes, perf/scale regression (Step 3.7) → create if missing, backfill, log the Scope Change. Lite escalates to full here.
- **Topic shift** — conversation moves off the story mid-flight with no stop signal or break → ask once: "Looks like we're moving off this story — want me to checkpoint it first?" Yes → as Stop signal. No → don't create, don't ask again for this detour.

No trigger, all four gates finish in one sitting → no file, ever. Expected path.

**Trip marker:** a write happens → one line before the gate message naming what was written: `[context file: wrote Understanding Summary + Assumptions]`. No file → no marker.

**Resuming — the one read that isn't trigger-gated.** Story start, or "continue"/"resume"/"where were we" → list `.breadcrumbs/context/` (repo root) before any story work. Empty or missing → start stateless. Anything there → read `resume.md` and follow it.

**Mechanics** (location, exclusion, cleanup, validators): `context-file-mechanics.md` — read once, the first time a trigger fires. **File structure + guardrails:** `context-template.md` — read once, at first creation. Neither on resume, neither otherwise.

**Project constitution** — optional, committed `.breadcrumbs/constitution.md` of standing repo-wide rules, separate from per-story files. Checked at Step 2.8 (full) or the lite gate below; creation and retirement rules in `context-file-mechanics.md`.

## Lite mode

Auto-detected at Step 1.4: `Bug fix` / `Copy/config/content change` → lite; everything else → full. Single source of truth for lite — step files aren't separately annotated.

- Step 1 gate + all of Step 2 collapse into one message: approach ("no design" depth) + task list (max 2) + the check that will prove it works + the `Scale target:` line, ending "Here's what I understand and how I'd build it — confirm?" → Step 3.
- **Two Step 2 checks survive the collapse**, inline:
  - `Bug fix` → one fragment each: root cause (not the symptom), repro confirmed, same defect looked for elsewhere, regression case named.
  - Either type → constitution check: `.breadcrumbs/constitution.md` exists → check the plan against its `status: active` lines; conflict → surface, resolve before continuing. No file → skip silently.
- Step 3: one wrap-up message after all tasks, not per-task. **Verification isn't collapsed** — 3.4 per task, 3.8 before the wrap-up.
- Step 4: PR draft as usual.
- File creation: same triggers, no lite exception. Mid-flight break → escalates lite → full, said in one line.

## The four steps

Read the step's file when you reach that gate — don't preload the others.

| Step | File | Gate |
|---|---|---|
| 1 — Understand & Clarify | `step1-understand.md` | Understanding + Assumptions confirmed (or folded into Step 2 if zero Material unknowns) |
| 2 — Plan | `step2-plan.md` | Plan + task breakdown confirmed (skipped in lite mode) |
| 3 — Implement | `step3-implement.md` | Every task checked off |
| 4 — PR | `step4-pr.md` | PR draft confirmed in chat |

## What NOT to do

Never skip a gate on your own initiative, file or no file, lite included — lite collapses which gates exist, never waives confirmation.

**User override:** only an explicit ask waives a gate ("skip the confirm," "just build it," "don't ask me between tasks") — never inferred from impatience, terseness, or a fast "yes." Then proceed without stopping, say in one line which gate was waived and what wasn't confirmed; file exists → record under `Gate Waivers`. Covers that gate, this story only.

Full guardrail list: `context-template.md`.

---

# Context file mechanics

Read once, the first time a file-creation trigger fires ("The context file" in `SKILL.md`). Resume rules live in `resume.md`.

**Location:** `.breadcrumbs/context/<story-slug>.md` — `<story-slug>` = short kebab-case id from ticket ID/title.

**Anchored at the repo root, always relative to it.** `.breadcrumbs/` sits next to the repo root (`git rev-parse --show-toplevel`; no git → nearest ancestor holding the project's root marker, else the working directory, and say which). Never resolve against a subdirectory cwd or a home directory; never store an absolute path inside the file — `/Users/<name>/...` doesn't survive another machine, checkout, or tool sandbox. Everything the file references (Flow, task file lists, Scope Changes) stays repo-relative for the same reason. Every platform opens the same checkout and reads the same file; the committed platform rules files carry the skill itself. The validator scripts are the one optional part — nothing blocks on them.

**Not committed.** Working memory, not a project artifact. On creation, exclude it in `.git/info/exclude`, **not `.gitignore`** — local and untracked, so the exclusion never lands in a commit or someone's diff.
- Already excluded (either file, `.breadcrumbs/context/` or broader `.breadcrumbs/`) → nothing to do.
- Not excluded → append `.breadcrumbs/context/` to `.git/info/exclude`, silently (local-only, reversible).
- No `.git/` → skip, don't fall back to `.gitignore`.

User explicitly wants it committed/shared → move the entry to `.gitignore` then, not before.

**Known limitation — unbounded growth:** Scope Changes/Clarifying Q&A are uncapped (Task Log is bounded via Step 2.7) — pure append, no rotation. Count starts looking like the task-count problem → flag it, consider whether the story should've been split.

**Cleanup:** PR merged (user-confirmed) → offer to delete. Never delete unprompted.

**Efficiency:** file exists → one write per gate, every section update batched into one pass, no read-then-write round trips. Don't re-read to confirm a write landed.

**Validation:** after a gate write (Understanding Summary, Plan, Task Checklist, or any structural change — not every Task Log append) → run `validate-context-file.mjs <path>`: catches a missing/malformed `Status` line, missing required sections, a broken checkbox. Not found → skip, don't block. A structure check, not a content re-read.

## Project constitution (optional, separate from per-story files)

Standing, project-wide non-negotiables that apply to *every* story ("payment retries always carry an idempotency key," "no PII in logs"). Not deleted after PR merge, meant to be committed — don't exclude it.

**Location:** `.breadcrumbs/constitution.md` (repo root, same anchoring rule). **Format:** flat list, one rule per line:

```
- <rule> — rationale: <why> — added <date> — status: active
- <rule> — rationale: <why> — added <date> — status: superseded by "<replacing rule, short>" on <date>
- <rule> — rationale: <why> — added <date> — status: retired on <date> — reason: <why it stopped applying>
```

Append-only; `status:` is the one field amended in place. Never delete a line.

**Retiring a rule:** only on an explicit user instruction ("we don't do X anymore," "Y replaces X"). Flip that line's `status:`; for a replacement, append the new rule as its own `status: active` line in the same pass. Never retire a rule because a plan is inconvenient, never infer it from one story's exception — a one-off deviation is a Scope Change or Assumption in that story's file.

**Reading:** checks apply to `status: active` lines only. Superseded/retired lines are history — don't check against them, don't report them as conflicts.

**Contradiction guard:** a new rule contradicts an existing active one → don't just add it. Surface both, ask which stands. Answered → new rule appended active, old one flipped to `superseded by`.

**Created only when earned, never scaffolded.** Triggers, all through the same ask-once confirmation, never appended silently:
- User states a rule that's clearly repo-wide ("we always do X across this whole project," not "for this story, do X") → "want me to save that as a standing project rule so future stories check against it too?" Confirmed → create if missing, append. Declined → log under this story's Assumptions, don't ask again for the same rule.
- Hand-edit to AI-written code that reads as a general preference (Step 3.5's "Learning from the edit").
- Correction that never becomes an edit — the same class of thing corrected twice in a story, or once in plainly repo-wide terms ("we never do X here"). Same ask, same wording.

The bar is repo-wide *and* standing; a single ambiguous correction doesn't clear it — that's an Assumption or a Task Log `Why`.

**Read:** once per story, if the file exists — Step 2.8 (full) or the collapsed lite gate. Not re-read every gate. Conflict with the plan → surface, resolve before continuing, don't build around it.

## Validator scripts

Two optional scripts: `validate-context-file.mjs` and `validate-commit-message.mjs` (Step 3.6). They live in a `scripts/` directory alongside the skill's files — never hard-code one platform's layout.

Resolve by trying `scripts/<name>.mjs` relative to, in order: the directory this file was loaded from → `skills/breadcrumbs/` under the repo root → `.claude/skills/breadcrumbs/` under the repo root → `~/.claude/skills/breadcrumbs/`. First hit wins; run `node <resolved-path> [args]`. Resolve once per session.

None resolve (skill pasted as rules text, no filesystem/shell, no `node`) → skip, fall back to the by-hand equivalent named at the call site, never block a gate on a missing script.

---

# Step 1 — Understand & Clarify

1. Read the story. **State back your understanding first**, own words, before asking anything. Repo look-ups stay scoped to the story's own terms ("Investigation scope" in `SKILL.md`).
2. Only then: follow-ups, only on what's genuinely vague. Scan against this taxonomy rather than guessing open-endedly:
   - Who/what/why: specific persona (not just "user"), what they're trying to accomplish, why it matters to them
   - Scope: explicitly in, explicitly out, one story or several bundled
   - Acceptance criteria: concrete testable "done," happy path step by step, demo scenario QA/PO will test against
   - Dependencies & context: other stories/APIs/systems, mockups/specs, what this blocks or unblocks
   - Data model/schema changes, source of truth, what happens to existing data
   - API/contract boundaries
   - Auth/permissions
   - Error handling & edge cases: error/loading/empty/success states, empty input, network failure, permission denied
   - **Scale target:** data volume, request rate/concurrency, latency budget. Story states one → record verbatim. Silent → Material only when the change sits on a data- or request-dependent path (new query, loop over user data, hot endpoint); otherwise Cosmetic → assume "none stated — current scale assumed," log per point 3. Sized-for-current-scale is a legitimate answer; *not knowing* is the failure. Step 2 sizes the plan against this line, Step 3.4 judges the diff by it.
   - Security/compliance, device/browser/platform
   - i18n/locale
   - Backward compatibility
   - Existing pattern to follow, or net-new

   Skip categories that obviously don't apply. Ask each genuinely vague item as its own question, one at a time, wait for the answer — never batch, even when several look like the same unknown.

   **Ask order + stop rule:**
   - Classify before asking (point 5): Material first. Cosmetic → assume and log per point 3, don't spend a turn unless the user's still volunteering detail.
   - Stop as soon as the story is buildable and every remaining gap is Cosmetic or safely assumable → remaining items go to Assumptions as `unconfirmed`.
   - Soft ceiling ~5 questions per sitting. Hit it with Material items open → stop anyway, log the rest `unconfirmed`.
   - Either stop fires → say so, one line, before the gate: `Stopping questions here — assuming <X>, <Y> (logged unconfirmed). Flag if either's wrong.` Silent assumption is the failure, not the assumption.
3. User can't answer (owner unavailable / undecided) → don't block. Log under Assumptions with reasoning, mark `unconfirmed`, tell the user it needs owner confirmation before final, proceed.
4. Classify story type now: `Bug fix` / `Copy/config/content change` (both **lite**) / `Small feature addition` / `Refactor/tech debt` / `New feature/subsystem` / `New service/integration` / `Performance/optimization` (all **full**; signals and design depth in Step 2.1). State the mode, one line.
5. **Tag every open question/assumption:** Cosmetic (naming, location, formatting — wrong guess costs nothing) or Material (data model, API/contract, business logic, security, user-visible behavior — wrong guess = rework). Tag count — **not** type/size — decides the gate below. 10-task "New feature," all-Cosmetic → gate merges. "Small feature," one Material unknown → gate stays separate.
6. **Gate:** investigation marker, then: file exists → write Understanding Summary + Assumptions in one pass, trip marker. No file → same content in chat. Understanding Summary always ends with one `Scale target:` line, the assumed form included.
   - **Zero Material unknowns** → fold Step 2 in: do its work silently (read `step2-plan.md`), present Understanding Summary + Plan together, one combined confirmation, both quoted verbatim. Regardless of type/task count.
   - **Any Material unknown remains** (even `unconfirmed`) → summary alone, quoted verbatim, stop. No Step 2 until confirmed.

---

# Step 2 — Plan

*Lite mode skips this step.* Full mode + zero Material unknowns (Step 1) → no separate gate, folded into 1.6. Decided purely by the Material count from 1.5 — never type, never task/file count.

Order matters: everything that can *add* work (points 3-5) runs before the task breakdown (point 6), so tasks are cut once and point 7's cap applies to the real list.

1. Classify from the confirmed Understanding Summary (done at 1.4 for lite types; do it here otherwise). Ask only if genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | reported defect, "should do Y but does Z" | No HLD/LLD — root cause + fix approach |
   | Copy/config/content change | text, labels, flags, env values, constants | No design — straight to task list |
   | Small feature addition | new behavior in existing architecture, no new component | LLD only, skip HLD |
   | Refactor/tech debt | no behavior change, restructuring | LLD only, scoped to what's restructured |
   | New feature/subsystem | new capability spanning components | Full HLD + LLD |
   | New service/integration | new external dependency, new cross-system data flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resource usage, scaling | No design doc — profiling findings + targeted fix |

   Type is *what kind of change*; size doesn't classify. Point 7's ceilings catch a story that outgrew its type.

2. Discuss the approach at the depth classification calls for: HLD → components, data flow, integration points. LLD → key functions/classes/schema. "No design" → the fix approach, one-two sentences. Enough to agree the shape before code, not a formal doc. Same scoped-search rule as Step 1.
   - **Tripwire:** plan surfaces a Material unknown Step 1 missed → stop, resolve there (ask, or log `unconfirmed` per 1.3) before continuing. Applies even when 1+2 merged.
   - **Architecture decisions:** 2+ valid approaches → pick one, state why, write it down (Plan section of the file, or the chat message if no file). Cross-team surface (FE/BE split) → agree the contract (API shape, request/response, error codes) before either side's tasks start.
   - **Risks/unknowns:** *implementation* risk, distinct from Step 1's requirement tags — parts you're unsure how to implement, unfamiliar code, anything needing a spike, anything that could break existing functionality. Genuinely open → same tripwire handling. Recorded (point 9), not just said.

**Depth gate for points 3-5** — single source of truth; the points don't restate it.

| Design depth | Points 3-5 |
|---|---|
| No design (copy/config, performance, bug fix reaching here via escalation) | Skip 3 and 4 — the one regression case that proves the fix is enough. Point 5 only if the story touches prod data/payments/migration. |
| LLD only (small feature, refactor) | Point 3: the single domain the story touches, folded into point 2 — no table walk. Point 4: one line. Point 5: only if schema/prod-data/payments involved. |
| Full HLD + LLD (new feature/subsystem, new service/integration) | All three explicitly, as written below. |

Lighter depth but the story genuinely carries the risk (a "small feature" writing a migration) → the risk decides, not the label.

3. **Domain-specific checks** — orthogonal to Type (a story spans 0, 1, or several domains). Anything surfaced goes into the approach (point 2) and, if it's work, into the task breakdown (point 6). Skip domains the story doesn't touch.

   **No re-asking.** Auth, error handling, backward compatibility and the scale target were scanned in Step 1. Here they're checked against the *plan*, silently — a question goes back to the user only via the point-2 tripwire.

   **Scale target check** — every design depth in full mode, one fragment. Walk the plan's data- or request-dependent paths (new query, loop over user data, call on a hot path) against Step 1's `Scale target:`. Holds → say how ("paginated, indexed on `user_id`"). Doesn't, or can't tell → point-2 tripwire: change the approach, or log under Risks/Unknowns as open. "Current scale assumed" → the check is that nothing gets worse than today. Sizing, not optimizing.

   | Domain | Checks |
   |---|---|
   | API/backend | Request/response contract defined (fields, types, status codes) — feeds point 2's cross-team contract; auth/permission requirements clear; rate limiting/throttling; idempotency (safe to retry); versioning impact on existing consumers; expected load/concurrency where it changes the design |
   | Mobile app | Offline behavior; iOS vs Android differences; app store review implications if UI/permissions change; battery/data impact if polling or background work |
   | Database/schema | Migration backward-compatible during deploy, reversible or rollback plan — feeds point 5; impact on existing queries/indexes; backfill for existing records; data volume at expected scale |
   | Bug fix (via lite→full escalation; the lite gate runs the same four inline) | Root cause understood, not the symptom; repro confirmed; same defect looked for elsewhere before patching one spot; regression test added — feeds point 4 |
   | Infra/DevOps | Uptime/downtime impact; monitoring/alerting for new failure modes; cost impact (new resources, scaling); scriptable/repeatable, not a manual one-off |
   | Data pipeline/ETL | Source data reliability/format assumptions validated; failure handling for a batch failing midway; reprocessing/backfill strategy; downstream consumers identified |
   | Third-party integration | Rate limits and pricing known; failure/downtime handling; auth/credential management; webhook vs polling decided |
   | UI-only/design | Responsive across breakpoints; accessibility (contrast, keyboard nav, screen reader); design system components reused, not one-offs |

4. **Testing plan:** which logic needs unit coverage; manual/integration cases (including Step 1's edge cases and any domain regression case from point 3); a clear way to verify against Step 1's acceptance criteria. Substantial test work → its own task in point 6.

   Scale target with a number and a way to measure it (benchmark, load script, query plan, timing assertion) → one case names it. No way to measure → say so, one fragment: Step 3.4's diff scan is then the only check.

   **Listed to be run, not filed.** Step 3 executes this set (3.4 per task, 3.8 as a whole), so each case states what runs, what passing looks like, and which task(s) it covers. A case mapped to no task → missing task or misplaced case; a task covered by no case → Step 3.4 falls back to the repo's own checks, a weaker verdict — decide now whether that's acceptable.

5. **Rollout & rollback** — only for stories touching production data, payments, or a migration/backward-compat path (New service/integration usually; Database/schema always; others only if the story says so): feature flag needed?, migration/backward-compat concerns, rollback plan confirmed. Flag/migration/backfill work becomes tasks in point 6, not a footnote.

6. Agreed → break into small tasks along natural seams: dependency order first, then component/layer (multi-part work) or file-module boundary (refactors). Multi-layer stories → name the layers explicitly — frontend (components, state, routing), backend (endpoints, logic), data (schema, migrations), integration points — only the ones touched. Scoped right = one Task Log entry (one What + one Why, no "and also"), ≤3 files. Otherwise split further. Nothing gets appended after point 7's cap check.
   - **Flow:** the ordered file/module list across all tasks — derived directly from the breakdown. Decided here, not revisited unless a Scope Change amends it.
   - **Sequencing:** which tasks have no shared dependency (safe to reorder/hand off), and the smallest independently shippable/demoable slice, if one exists. Recorded (point 9), not just said.

7. Cap total tasks by type — ceiling, not target, applied to the finished list:

   | Type | Max tasks | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — likely misclassified |
   | Small feature | 5 | reconsider — may be "new feature/subsystem" |
   | Refactor | 8 | acceptable upper bound |
   | New feature/subsystem | 10 | **stop, flag** — propose splitting before Step 3 |
   | New service/integration | 10 | same — flag before implementing |
   | Performance | 5 | more usually means multiple bottlenecks — separate stories |

   **Flow size check:** Flow nearing ~30 distinct files → flag, propose splitting, before Step 3. A "Small feature" past ~8 files → raise as possible misclassification.

8. **Constitution check:** `.breadcrumbs/constitution.md` exists → read it once, check the *whole* plan (approach, domain checks, testing, rollout, tasks) against its `status: active` lines before presenting; ignore superseded/retired lines. Runs last on purpose — its rules match content that doesn't exist until points 3-5. Conflict → point-2 tripwire handling. No file → skip silently.

9. File exists → one pass, writing: story type, design depth, HLD/LLD notes, architecture decisions, **Risks/Unknowns**, domain-check outcomes, scale-target outcome, testing plan, rollout/rollback notes, Flow, **Sequencing**, Task Checklist — each only where it applied. No file → stays in chat.
10. **Gate:** investigation marker, then trip marker if a write happened. Present plan + task breakdown, quoted verbatim. Stop, wait for confirmation before implementing (`step3-implement.md`).

---

# Step 3 — Implement

1. Work the Task Checklist one task at a time.
2. **Don't ask the user mid-task.** Use best judgment. Genuine judgment call → log in Task Log's "Why." Changes what was agreed (contradicts plan, needs a scope decision) → log under Scope Changes, flag immediately.
3. Apply `ponytail`: simplest thing that works, stdlib/existing deps before new code, no unrequested abstractions. Never simplify away input validation, error handling, security, accessibility, or holding the story's scale target — "works" means at that scale, not on the dev fixture. "Current scale assumed" → don't make the path worse than today.
4. **Verify before checking the task off.** A task is done when something demonstrates it works, not when the code is written.
   - Run the cases Step 2.4 mapped to this task (lite → the check named at the collapsed gate). Nothing mapped → run the repo's own fast checks over what you touched (existing test file, typecheck, lint) and name which.
   - Nothing executable (copy change, doc edit) → say so, plus what you inspected instead. Valid verdict; silence isn't.
   - Fails → not a checkoff. Fix, re-run. Still fails and the cause is the plan → point 7's Mid-flight break, not a checkoff with a caveat.
   - **Self-review, same pass:** re-read your diff against the task's Why and the plan — leftover scaffolding, a TODO standing in for the fix, a workaround where root cause was the point, an unasked-for abstraction. Fix now, don't present it.
   - **Scale scan, same pass:** read the diff for patterns that break under growth — a query/network call per item of a growing collection, unbounded load into memory, a new query path with no pagination or index, synchronous work on a hot path. Trivial, in scope → fix now, note in `Verified:`. Not trivial, or the diff can't hold the target → **not a checkoff**: point 7's perf regression trigger. Clean → say nothing.
   - Outcome goes into the Task Log as `Verified:` — what ran, what it showed. Step 4's **Test** section comes from this field only.
5. **Standing manual-edit review** — before each task, and on resume: `git status` / `git diff HEAD` over the story's files. Any change you didn't make is a user hand-edit. Review it, one line (`Check:`): correct against the task's Why and the plan, or issue found (what, where). File not on the story's Flow (Step 2.6) → say so first, one line, non-blocking ("that file's outside this story's planned Flow — [reason if evident]"). A review, not a veto: the edit stands unless it breaks something; say so rather than silently re-editing.

   After each task — file exists → append Task Log entry (`Verified:` included), check it off, same write, trip marker. Three forms (`context-template.md`): judgment call → full What/Why block; mechanical → single checklist line; user hand-edit → checklist line + `Check:` verdict (+ `Flow:` line if off-plan). Quote the form written, don't restate. Either way: tell the user what was done, move to the next task without waiting unless interjected. No file → narrate progress in chat, manual-edit check and Flow warning included.

   **Learning from the edit:** hand-edit reflects a repo-wide preference, not a one-off fix (consistently strips comments a certain way, always adds a specific guard, renames a pattern the same way) → ask once: "Noticed you always change X to Y — save that as a standing project rule?" Confirmed → append to `.breadcrumbs/constitution.md` (format in `context-file-mechanics.md`), apply from the next task onward. Declined → don't ask again for this pattern. Story-specific edit → no ask. Same ask covers a correction the user only *says*, when it repeats or is plainly repo-wide ("we never do X here").
6. **Commit each task**, right after its Task Log write, before the next task. One commit per task — mirrors the Task Log 1:1, each commit carrying that task's own Why.

   Conventional Commits: `<type>(<scope>): <imperative summary>`. Scope = affected module/area, omit if obvious. Body = short bullets from the task's What/Why — compressed, not the Log entry verbatim.

   | Type | Use for |
   |---|---|
   | `feat` | New feature |
   | `fix` | Bug fix |
   | `docs` | Documentation |
   | `style` | Formatting, no logic change |
   | `refactor` | No behavior change |
   | `perf` | Behavior unchanged, speed/memory improved |
   | `test` | Adding/modifying tests |
   | `chore` | Maintenance, tooling, deps |
   | `revert` | Undoing a task's commit (point 7 owner drop / Scope Change) — `revert(<scope>): <what was undone>`, reverted hash in the body |

   Reverting a task → `git revert <that task's commit>`, then rewrite the header to the `revert` form (git's default `Revert "..."` fails the validator); the reason goes in the body, from the Scope Changes entry.

   Scope change mid-task → still one commit once it lands; type reflects what actually shipped.

   Before `git commit`, check the header with `validate-commit-message.mjs` (resolve per "Validator scripts" in `context-file-mechanics.md`); not found → check by hand against the table, don't block.
7. Test fails / owner invalidates an assumption / scope changes / **perf or scale regression surfaces** (a planned case slows, or point 4's scan finds a pattern that won't hold) → Mid-flight break trigger (`SKILL.md`). Once handled: structured Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update Assumptions/Plan, adjust Task Checklist. Perf case: tell the user immediately, one line — what regressed, against which target, what it would take to hold it — before fixing or working around it. Before/After names the target and the pattern that broke it. Absorb or fix is the user's call — never a silent fix, never a silent ship.
8. **Gate:** every task checked off → **run the whole planned test set now**: every case Step 2.4 listed (lite → the check named at the collapsed gate), plus the repo's own suite over what the story touched. Per-task runs prove tasks in isolation; this proves they compose.
   - Green → summarize what was built *and what proved it* (one line: cases run + outcome), plus the scale target it holds and whether measured or only scanned. Stop, wait for confirmation before PR (`step4-pr.md`).
   - Red → fix, re-run; cause is the plan → point 7's Mid-flight break. Never present a story as ready with a known-failing case.
   - Nothing runnable for the whole story → say so at the gate, with what was checked instead.

   Commits for all tasks already exist — Step 4 drafts the PR description, it doesn't create commits. A fix made *here* is its own commit and its own Task Log entry.

---

# Step 4 — PR

1. Tell the user the work is ready for a PR.
2. Title: `<Ticket ID/slug>: <imperative summary>` — from the file header + Understanding Summary, or the conversation if no file. Ticket has a URL (pasted story, file header, known tracker convention) → link the ID in the heading.
3. **Two readers:** the reviewer today, and whoever blames a line into this PR months later with no chat to consult. Each section is judged by whether it tells one of them something the diff can't.

   Five core sections — **What, Why, Test, Rollback, Dependencies** — plus two optional (**Reviewer focus, Out of scope**) and one re-draft addendum (**What changed since last PR**). Bias toward fewer: include only what earns its place. File exists → pull from it, don't re-summarize; no file → derive from the conversation.
   - **What** — always. The *behavior change*: what the system does differently now. Not the problem (that's Why), not the file list (that's the diff). ← Task Log "What" entries.
   - **Why** — always, unless it'd restate What (trivial copy/config fix) → drop. Root cause or constraint, and the alternative considered and rejected, one fragment each — naming the rejected approach saves a review round more than anything else here. ← Task Log "Why", Assumptions, Scope Changes, only where they add something.
   - **Test** — what actually verified it, *with the outcome*: cases run at Step 3.4/3.8 and what they showed, manual repro steps, or "nothing runnable" + what was inspected. Skip only when genuinely nothing to verify. ← Task Log `Verified:` lines and the Step 3 gate run — **not** the Plan's testing notes. Verification reported none → say that, don't invent. Scale target → one fragment: the target, and whether a case measured it or Step 3.4 only scanned.
   - **Rollback** — only if reverting isn't a plain revert (migration, feature flag, external state, backfill). ← Plan/Scope Changes.
   - **Dependencies** — only if this PR depends on or blocks something, including sitting on another unmerged branch. ← Assumptions/Plan; `git merge-base HEAD <default-branch>` isn't the default branch's tip → stacked, name the base branch, note it merges first.
   - **Reviewer focus** — optional. Only when the diff is uneven: one hunk carries the judgment call, the rest is mechanical (rename, generated file, moved code, formatting). Name where to read first and what to skim. Uniform diff → omit. ← Task Log: full What/Why entries vs. single-line mechanical ones.
   - **Out of scope** — optional. Only when a reviewer would plausibly ask "why didn't this also…": a related defect seen and left, a follow-up filed, a boundary drawn on purpose. Name the thing and where it went. ← Assumptions marked out of scope, Scope Changes that narrowed, Step 2 "not in this story" notes.
   - **What changed since last PR** — later-update case only. ← Scope Changes dated after the last PR Summary write.
4. **Shape: one point → a sentence; two or more → bullets, never a paragraph.** Each bullet one fact or one reason, a line long, no sub-bullets.

   **Cap every section at 2 bullets, except Why at 3.** Pulled content runs long → compress to the essential points, don't truncate. Can't fit without losing something needed → the task/decision was too broad; not a reason to break the cap. **Whole draft reads in 2-5 min.** Longer with every section trimmed and only earned ones kept → the story was too big for one PR, say so.

   Never: restate the diff, narrate the journey ("first I tried…"), list the commits, or leave an empty heading.

   Template:
   ```markdown
   ## [<Ticket ID>](<ticket URL>): <imperative summary>

   **What:** <one sentence when it's one point>

   **Why:**
   - <root cause / constraint>
   - <rejected alternative, only if one was weighed>
   - <third point, only if needed>

   **Test:**
   - <case run + outcome>
   - <second case / suite, only if needed>

   **Rollback:** <only if non-trivial>

   **Dependencies:** <only if any>

   **Reviewer focus:** <only if the diff is uneven>

   **Out of scope:** <only if something was deliberately left>
   ```
   Example (bug fix — Rollback and Dependencies omitted; Reviewer focus and Out of scope earned; What is one point so it stays a sentence):
   ```markdown
   ## [PARK-482](https://tracker.example/PARK-482): Fix duplicate charge on payment retry

   **What:** Retries now reuse one idempotency key generated per order, so the provider sees a single charge across the whole retry sequence.

   **Why:**
   - Retries omitted the key, so the provider treated each one as a fresh charge.
   - Considered de-duplicating on our side by order ID; rejected — provider-side idempotency is the contract, and a local check still races across two workers.

   **Test:**
   - Regression test simulates a retried request, asserts a single charge — passes.
   - Provider-retry suite green.

   **Reviewer focus:** `retry.ts` key generation is the judgment call; the `charge.ts` change only threads the key through.

   **Out of scope:** Webhook replays can also double-charge — separate root cause, filed as PARK-490.
   ```
5. **Before showing the draft, re-scan it against rule 4.** Any section with 2+ facts written as flowing prose instead of `-` bullets → split it now. Check this after drafting, not after the user flags it.
6. **Show the draft directly in chat, stop there.** The chat message *is* the deliverable — the user copies it into the platform's PR field. Nothing written to the context file here.
7. **Gate:** confirm or request changes, iterate in chat, until happy with what they'll paste.
8. **[Testing] Session token stats.** Run `node scripts/session-token-stats.mjs` and report the one-line effective-token total under the draft. Add `--by-tool` for a breakdown by category (system prompt, Read, Bash, Edit, chat replies, ...) when the user wants to see where the session's tokens went, e.g. to spot which step of the skill is expensive. Best-effort — reads the transcript's own usage blocks, no separate tracking. Drop this step once it's no longer needed for testing.
9. Confirmed + file exists → write one line to PR Summary: `Last drafted: <date>` (anchor for diffing Scope Changes later, not a text copy). Update Status to `pr-ready`, same pass. Trip marker. No file → nothing to write.

---

# breadcrumbs context file — template & guardrails

Read once per story, at file creation. Not on resume, not if no trigger fires.

## Content style

Read by AI only — never the user. Fragments, not sentences. Drop articles/connectives where meaning stays unambiguous. Abbreviate freely. Optimize for a resuming model re-deriving state fast.

- Prose: `Why: We added a mutex because there was a race condition between the two writers.`
- Telegraphic: `Why: race condition (two writers) — added mutex.`

Markdown structure (headers, lists, checkboxes) stays as-is — parsing scaffolding, not prose.

## File structure

```markdown
# <Story title / ticket ID>
Status: understanding | planning | implementing | pr-ready | done

## Original Story
<verbatim paste>

## Understanding Summary
<restated understanding, confirmed by user on <date>>
Scale target: <volume / rate / latency budget the story is sized for — or "none stated — current scale assumed">

## Clarifying Q&A
- Q: ... — A: ...

## Assumptions
- <assumption> — reason: <why> — status: unconfirmed | confirmed by <who> on <date>

## Current Requirements
<requirements as they stand right now, amended in place as scope changes land — "what's true today," short, never a history log>

## Plan
Story type: <bug fix | copy/config | small feature | refactor | new feature/subsystem | new service/integration | performance>
<approach, HLD/LLD notes if that depth applies, agreed on <date>>
<architecture decision(s): chosen option — why, rejected option(s) — why not. Only where 2+ valid approaches existed.>
<domain-check outcomes / scale-target outcome (holds — how; or open risk) / testing plan / rollout+rollback notes — only the ones that applied, one fragment each.>

### Risks / Unknowns
- <implementation risk — unfamiliar code, possible breakage, needs a spike> — status: open | resolved: <how>

### Sequencing
<tasks with no shared dependency; smallest independently shippable slice, if one exists. Omit if neither applies.>

## Flow
<ordered list of files/modules this story is expected to touch, from the task breakdown — e.g. "1. src/foo.ts (Task 1)  2. src/bar.ts (Task 2, 3)". Amended only via a Scope Change entry, never edited in place.>

## Task Checklist
- [x] Task 1 — <short description> — files: <list>
- [ ] Task 2 — ...

## Task Log
### Task 1 — <date>
- What: <what was implemented>
- Why: <reasoning / decisions made>
- Verified: <what ran — planned case / repo check / "nothing runnable: <what was inspected instead>"> — <outcome>

### Task 2 — <date> (mechanical, no judgment call)
- [x] Task 2 — <short description> — files: <list>
- Verified: <as above>

### Task 3 — <date> (manual edit, by user)
- [x] Task 3 — <short description> — files: <list>
- Check: <correct | issue found — one line, per the manual-edit review>
- Verified: <as above>
- Flow: <on plan | off plan — reason if evident. Only when the edited file isn't on the story's Flow.>

## Scope Changes / Reimplementation
### <date> — <short label>
- Trigger: <test failure, owner feedback, scope change, etc.>
- Before: <requirement/assumption as it was>
- After: <requirement/assumption as it is now>
- Affected tasks: <task numbers>
- Why: <reasoning behind the change>

## Gate Waivers
- <gate> — waived by user on <date> — not confirmed: <what went unreviewed>

## PR Summary
Last drafted: <date> — full text shown in chat, not duplicated here. Anchor for diffing "what changed since last PR" on a later update.
```

Append, never overwrite — except `Status`, Task Checklist checkboxes, Current Requirements, and a Risks/Unknowns entry's `status:`, amended in place. Everything else (Scope Changes, Task Log, Assumptions) is a running record: add entries, never rewrite past ones.

Three Task Log forms — classification per Step 3.5, shown as Task 1/2/3 above. `Verified:` on all three, no exceptions (Step 3.4): what ran and what it showed, one fragment. "Nothing runnable" is a legitimate value; an absent line isn't.

## What NOT to do

- Don't skip a gate on your own initiative, lite mode included. Only an explicit user waiver skips one ("User override" in `SKILL.md`) — log it under `Gate Waivers`.
- Don't ask the user questions during Step 3 task execution — decide, log, move on. Exception: scope-changing issues, surface immediately.
- Don't check a task off without a `Verified:` line; don't pass the Step 3 gate with a known-failing case. "Tests exist" isn't verification; "tests ran, here's the outcome" is.
- Don't overwrite past entries — running record, not a snapshot.
- Don't commit the context file or reference it in the PR diff.
- Don't delete it unless the user confirms the PR merged.
- Don't let a lite-mode story silently absorb a scope change or failed test — escalate to full (Mid-flight break trigger in `SKILL.md`) rather than tracking it in chat memory alone.

---

# Resuming a story

Read when `.breadcrumbs/context/` (repo root) has files and the user is starting or continuing a story. Not needed when the directory is empty or missing.

**Match:** one file whose name/slug clearly matches what the user's asking about → read it, summarize status back ("Here's where this stood: ... currently at Step X"), pick up at the next unchecked task — don't redo earlier gates. More than one file and the request doesn't unambiguously point to one (generic "let's continue," or a new/vague prompt while other stories sit mid-flight) → don't guess. List candidates cheaply: filename (slug) + first two lines of each (title, `Status:`) — never a full read at this stage. Ask which one, then proceed as the one-match case. Zero matches → nothing to resume, start stateless.

**Staleness check (piggybacks on the scan, no separate pass):** while listing, note any file with `Status: pr-ready` (first two lines) and mtime older than 7 days — the PR went out and nobody confirmed merge/delete. Collect across the whole directory. Any found → after resolving the current story's resume/start, one line: "N context file(s) sitting at pr-ready for 7+ days: <slugs> — merged? want these deleted?" Confirmed per-file or in bulk → delete. Never delete unprompted.

**Compaction on resume:** the file stays append-only, full detail — what compacts is the *chat summary*. Task Log/Scope Changes past 3 entries → one line each for the older ones (date + What), full What/Why only for the most recent 2-3 and anything still open (unconfirmed Assumptions, unresolved Scope Changes). User asks about an older decision → read that entry's full detail on demand.

**Then:** run Step 3.5's standing manual-edit review (`git status` / `git diff HEAD` over the story's files) before touching the next task, and read the step file for the step the story is at.
