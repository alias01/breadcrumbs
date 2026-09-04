<!-- GENERATED from skills/breadcrumbs/SKILL.md by scripts/build-platforms.mjs — edit the source, then re-run the script. -->

# breadcrumbs

## Core Philosophy

A story never survives reality unchanged: assumptions filled in, scope grows, tests surface edge cases. Fine in isolation → breaks down when nobody (future session, different AI) can reconstruct what was decided, why, what's left.

Four gates (Understand → Plan → Implement → PR), confirmed with the user each time, backed by one persistent file → any session resumes mid-story.

**Why the writes pay off:** reasoning captured at decision-time = cheap. Reconstructed later (reviewer asks why / scope shifts) = expensive, often inaccurate by then. Task Log "Why" = original reasoning, not a retrofit. Scope Changes = only what changed, not the full history re-derived.

## Communication style

Chat only — context file has its own denser style ("Content style" in `context-template.md`). Don't conflate.

Terse, bullet/fragment, glanceable. Senior/expert audience → jargon freely, no hedging, no restating known context, no multi-paragraph narration. Expand only if asked / confusion signaled, then step down in complexity.

## Investigation scope

Understanding a story needs enough repo context to ask good questions and plan real tasks — not a full-repo read. Search outward from the story's own keywords/entities (feature name, endpoint, table, component, error message) rather than surveying the tree.

**`graphify` first.** If a knowledge graph exists for this repo (`graphify-out/` present) or the skill is installed, query it for the story's keywords/entities before touching the filesystem directly — it's cheaper than grep/Explore and answers "what relates to what" questions a raw text search can't. Fall back to targeted lookups (grep for the term, `Explore` agent at "quick" or "medium" breadth) only for what graphify's query/path/explain tools don't resolve, or when graphify isn't present at all. Full-file reads are last resort, for whatever neither graphify nor a targeted lookup settles. Stop once Step 1's taxonomy categories are answered or Step 2's Flow is identified — widen only when a specific remaining unknown demands it, never on a general "let's see what's here."

## The context file

**Created only on trigger, never by default.** Every story starts stateless: gates run in chat only, nothing on disk. Three triggers create the file:
- **Stop signal** — "let's continue tomorrow," "pause here," or similar → create now, backfill Original Story/Understanding/Plan/Task Checklist from the conversation, at whatever step you're at. Mode/design depth unchanged — this trigger alone doesn't escalate lite → full.
- **Mid-flight break** — test fails, an assumption breaks, scope changes, a perf/scale regression surfaces (Step 3.7) → create if it doesn't exist yet, backfill same way, log the Scope Change entry. Lite mode also escalates to full here (more rigor now warranted).
- **Topic shift** — conversation moves off the current story to something clearly different, mid-story, with no explicit stop signal or mid-flight break → don't silently create/write. Ask once: "Looks like we're moving off this story — want me to checkpoint it first?" Confirmed → same as Stop signal: create if it doesn't exist, backfill Understanding/Plan/Task Checklist at whatever step you're at, mode/design depth unchanged. Declined → don't create, don't ask again for this same detour, continue normally.

No trigger fires, all four gates finish in one sitting → no file, ever. Expected path, not a skipped step.

**Trip marker:** write happens → one line before the gate message naming what was written, e.g. `[context file: wrote Understanding Summary + Assumptions]`. No file yet → no marker, content just shown in chat.

**Resuming — the one read that isn't trigger-gated.** Story start, or "continue"/"resume"/"where were we" → list `.breadcrumbs/context/` (repo root) before any story work. Empty or missing → nothing to resume, start stateless as above. Anything there → read "Resuming" in `context-file-mechanics.md` and follow it (match → read the file, summarize status, pick up at the next unchecked task; several candidates → list, ask). Skip this and a saved trail is invisible — the file only pays off if it's looked for.

**Mechanics (location, not committed, cleanup, efficiency):** see `context-file-mechanics.md`. Read once, the first time a trigger above actually fires — not before. (The Resuming section is the exception, per the paragraph above.)

**Project constitution** — a separate, optional, committed file of standing repo-wide rules (distinct from the per-story file above). See "Project constitution" in `context-file-mechanics.md` for when it's created and how Step 2 checks against it.

**File structure & guardrails:** see `context-template.md`. Read once, first creation only — not on resume, not if no trigger fires. One guardrail without opening that file: **never skip a gate**, file or no file.

## Lite mode

Auto-detected Step 1.4: `Bug fix` / `Copy/config/content change` → lite. Everything else → full mode, per the four steps below. Single source of truth for what lite changes — step files aren't separately annotated.

- Step 1 gate + all of Step 2 collapse into one, unconditionally (lite types are always simple enough, no Material/Cosmetic check needed): state approach ("no design" depth) + task list (max 2) + the check that will prove it works, one message ending "Here's what I understand and how I'd build it — confirm?" → Step 3.
- **Two Step 2 checks survive the collapse.** Neither scales with story size, and lite is where both get skipped most often:
  - `Bug fix` → Step 2.3's bug-fix domain row, inline, one fragment each: root cause understood (not the symptom), repro confirmed, same defect looked for elsewhere before patching one spot, regression case named. Four fragments, not a design doc. Dropping them is how a lite fix ships as a patch over a symptom.
  - Either lite type → Step 2.8's constitution check (`.breadcrumbs/constitution.md`). Standing repo-wide rules have no story-type exemption — "it's only a copy change" is exactly the story that violates one quietly. No file → skip silently.
- Step 3: one wrap-up message after all tasks, not per-task. **Verification isn't collapsed** — 3.4 still runs per task, 3.8 still runs the named check before the wrap-up.
- Step 4: PR draft as usual, from the conversation.
- File creation: same triggers as "The context file" above, no lite exception. Scope change / test failure / perf regression mid-flight → escalates lite → full too, same moment the file's created. Say so in one line.

## The four steps

Read the step's file when you actually reach that gate — don't preload the others up front, that's the point of splitting them out.

| Step | File | Gate |
|---|---|---|
| 1 — Understand & Clarify | `step1-understand.md` | Understanding + Assumptions confirmed (or folded into Step 2 if zero Material unknowns) |
| 2 — Plan | `step2-plan.md` | Plan + task breakdown confirmed (skipped in lite mode) |
| 3 — Implement | `step3-implement.md` | Every task checked off |
| 4 — PR | `step4-pr.md` | PR draft confirmed in chat |

## What NOT to do

Never skip a gate on your own initiative, even in lite mode — lite collapses which gates exist, never waives confirmation.

**User override:** the user can waive a gate, but only by saying so explicitly ("skip the confirm," "just build it," "don't ask me between tasks"). Then: proceed without stopping, and say in one line which gate was waived and what wasn't confirmed. File exists → record it under `Gate Waivers` (`context-template.md`) — a resuming session must not read unconfirmed content as agreed. Waiver covers the gate the user meant, for this story only; it doesn't generalize to the remaining gates or carry into the next story. Never infer a waiver from impatience, terseness, or a fast "yes" — only from an explicit ask.

Full guardrail list: `context-template.md`, read alongside the template on first write.

---

# Context file mechanics

Read once, the first time a file-creation trigger fires (see "The context file" in `SKILL.md` for the triggers themselves). Not needed before that.

**Location once created:** `.breadcrumbs/context/<story-slug>.md` — `<story-slug>` = short kebab-case id from ticket ID/title.

**Anchored at the repo root, always relative to it** — that's what makes a story resumable on another platform. `.breadcrumbs/` lives next to the repo's own root (find it with `git rev-parse --show-toplevel`; no git → nearest ancestor directory holding the project's root marker, else the working directory, and say which was used). Never resolve it against the current working directory when that's a subdirectory, never against a home directory, never store an absolute path inside the file itself — a path like `/Users/<name>/...` doesn't survive a different machine, a different checkout, or a different tool's sandbox.

Everything the file references — Flow entries, task file lists, Scope Changes — stays repo-relative for the same reason. Cursor, Windsurf, Copilot, Gemini and Claude all open the same checkout and read the same `.breadcrumbs/context/<slug>.md`; the platform-specific rules files (`AGENTS.md`, `.cursor/rules/`, `.windsurf/rules/`, `.clinerules/`, `.kiro/steering/`, `.github/copilot-instructions.md`) are committed and carry the skill itself, so the resuming tool has both halves. The optional validator scripts are the one part that may be absent — that's why nothing blocks on them.

**Not committed.** Working memory, not a project artifact — no reason to exist past PR merge.

On creation, exclude it — but **in `.git/info/exclude`, not `.gitignore`**. Same effect for the user, and it's a local, untracked file: the exclusion never lands in a commit or shows up in someone else's diff. `.gitignore` is tracked; silently editing it puts an unexplained line in the story's own PR.

- Already excluded (either file, `.breadcrumbs/context/` or a broader `.breadcrumbs/`) → nothing to do.
- Not excluded → append `.breadcrumbs/context/` to `.git/info/exclude`, no announcement needed. Silent because it's local-only and reversible; anything touching a tracked file wouldn't be.
- No `.git/` (not a repo, or a worktree without one) → skip, don't fall back to `.gitignore`.

User explicitly wants it committed / shared with teammates → that's their call, they'll say so; move the entry to `.gitignore` then, not before.

**Resuming:** before any story work, check `.breadcrumbs/context/` for existing files. One match, name/slug clearly matches what the user's asking about → read it, summarize status back ("Here's where this stood: ... currently at Step X"), resume. Zero matches → nothing to resume; story hasn't started, or it's mid-way/finished in an unbroken conversation with no trigger fired yet. More than one file present and the user's request doesn't unambiguously point to one (generic "let's continue," or a new/vague prompt while other stories sit mid-flight) → don't guess. List the candidates cheaply: filename (slug) + first two lines of each (title, `Status:`) — never a full read at this stage, cost shouldn't scale with how many stories are open or how long they've grown. Present that list, ask which one. Once picked, proceed as the one-match case (full read, then resume).

**Staleness check (piggybacks on the scan above, no separate pass):** the directory listing itself — filenames + mtimes — is already free at this point regardless of match count. While scanning, note any file with `Status: pr-ready` (first two lines, same cheap read as the listing case) and mtime older than 7 days — that combination means the PR draft went out and nobody came back to confirm merge/delete. Collect these across the whole directory, not just the story being resumed or started. Any found → after resolving the current story's resume/start, mention them once in one line: "N context file(s) sitting at pr-ready for 7+ days: <slugs> — merged? want these deleted?" Confirmed per-file or in bulk → delete. Same rule as ordinary cleanup: never delete unprompted, this only surfaces the offer sooner instead of waiting for someone to reopen that specific story.

**Compaction on resume:** the file itself stays append-only — full detail, never compressed, that's the audit trail Core Philosophy depends on. What compacts is the *chat summary* read back to the user. Task Log/Scope Changes past 3 entries → summarize the older ones in one line each (date + What, no Why detail), give full What/Why detail only for the most recent 2-3 entries and anything still open (unconfirmed Assumptions, unresolved Scope Changes). If the user then asks about an older decision specifically, read that entry's full detail on demand — the file has it, the summary just didn't restate it. Keeps resume cost flat regardless of story length instead of scaling with it.

**Known limitation — unbounded growth:** Scope Changes/Clarifying Q&A are uncapped (unlike Task Log, bounded via Step 2.7's task ceiling) — pure append, no rotation, no archival. Count starts looking like the task-count problem → treat it the same way: flag it, consider whether the story should've been split.

**Cleanup:** PR merged (user-confirmed) → offer to delete. Never delete unprompted.

**Efficiency:** file exists → one write per gate, every section update batched into one pass, no read-then-write round trips. Don't re-read to confirm a write landed — trust it.

## Project constitution (optional, separate from per-story files)

Standing, project-wide non-negotiables — not this story's decisions, decisions that apply to *every* story in this repo (e.g. "payment retries always carry an idempotency key," "no PII in logs"). Different lifecycle from a per-story context file: not deleted after PR merge, meant to be committed (it's a project artifact, not working memory) — don't exclude it, in `.gitignore` or `.git/info/exclude`.

**Location:** `.breadcrumbs/constitution.md` (repo root, same anchoring rule as the context file above — it's committed, so it must resolve identically on every machine and platform). **Format:** flat list, one rule per line:

```
- <rule> — rationale: <why> — added <date> — status: active
- <rule> — rationale: <why> — added <date> — status: superseded by "<replacing rule, short>" on <date>
- <rule> — rationale: <why> — added <date> — status: retired on <date> — reason: <why it stopped applying>
```

Still append-only: the file only grows, and `status:` is the one field amended in place — a retired rule's line stays exactly as written, so the audit trail of what the project once required survives. Never delete a line.

**Retiring a rule:** only on an explicit user instruction ("we don't do X anymore," "Y replaces X"). Flip that line's `status:`, and for a replacement, append the new rule as its own `status: active` line in the same pass. Never retire a rule because a plan is inconvenient, and never infer it from one story's exception — a one-off deviation is a Scope Change or an Assumption in that story's context file, not a constitution edit.

**Reading:** point 8's check applies to `status: active` lines only. Superseded/retired lines are history — read past them, don't check against them, don't report them as conflicts.

**Contradiction guard:** appending a rule that contradicts an existing active one → don't just add it. Surface both lines, ask which stands. Answer given → new rule appended active, old one flipped to `superseded by`. Two active contradictory rules is the failure state this format exists to prevent.

**Created only when earned, never scaffolded speculatively:** a user states a rule mid-story that's clearly repo-wide, not story-specific ("we always do X across this whole project," not "for this story, do X") → ask once, "want me to save that as a standing project rule so future stories check against it too?" Confirmed → create if missing, append the rule. Declined → log it under this story's Assumptions instead, don't ask again for the same rule.

Two implicit triggers besides something the user says out loud:

- **Hand-edit to AI-written code** (see Step 3.5's "Learning from the edit") — the edit reads as a general preference rather than a fix to this task alone.
- **Correction that never becomes an edit** — the user corrects the same class of thing twice in a story, or once in plainly repo-wide terms ("we never do X here"), without touching the file themselves. Same ask-once, same wording. This is the trigger that catches the correction nothing else here retains: "don't put the token in the log line," said once in chat, is gone the moment the session ends unless it's asked about and written down.

Both go through the same confirmation as a stated rule — never appended silently. A one-off correction specific to this task isn't a rule; it's an Assumption or a Task Log `Why` in this story's file. The bar is repo-wide *and* standing, and a single ambiguous correction doesn't clear it.

**Read:** once per story, if the file exists. Full mode → Step 2 (Plan), point 8, last, after the plan is complete (`step2-plan.md`). Lite mode → the collapsed Step 1+2 gate ("Lite mode" in `SKILL.md`), since lite skips Step 2 entirely and these rules are repo-wide, not scaled to story size. Not re-read every gate.

**Checked, not just read:** Step 2's plan gets checked against its active rules before presenting to the user. Conflict → same handling as the Step 2.2 tripwire (a missed Material unknown): surface it, resolve before continuing, don't build around it.

**Validation:** after a gate write (Understanding Summary, Plan, Task Checklist, or any structural change — not every Task Log append), run `validate-context-file.mjs <path>` — catches a missing/malformed `Status` line, missing required sections, or a broken checkbox before it compounds across later gates. Not found → skip, don't block on it. A failure here doesn't override "don't re-read to confirm a write landed" above — it's a structure check, not a content re-verification.

## Validator scripts

Two optional scripts ship with the skill: `validate-context-file.mjs` and `validate-commit-message.mjs` (used by Step 3.6). They live in a `scripts/` directory alongside the skill's own files, so the path depends on how the skill was loaded — never hard-code one platform's layout.

Resolve by trying, in order, `scripts/<name>.mjs` relative to: the directory this file was loaded from → `skills/breadcrumbs/` under the repo root → `.claude/skills/breadcrumbs/` under the repo root → `~/.claude/skills/breadcrumbs/`. First hit wins; run it as `node <resolved-path> [args]`. Resolve once per session, reuse the hit.

None of them resolve — the skill was pasted in as rules text, or the platform has no filesystem/shell — → skip the check, fall back to the by-hand equivalent named at the call site, never block a gate on a missing script. Same for a platform with no way to run `node`.

---

# Step 1 — Understand & Clarify

1. Read the story. **State back your understanding first**, own words, before asking anything → surfaces most misunderstandings with zero questions. Any repo look-up needed to do this stays scoped to the story's own terms — see "Investigation scope" in `SKILL.md`, not a full-repo read.
2. Only then: follow-ups, only on what's genuinely vague — not everything askable in theory. Scan against a fixed taxonomy rather than open-ended guessing, so a Material gap doesn't slip through because nobody thought to ask:
   - Who/what/why: specific persona (not just "user"), what they're trying to accomplish, why it matters to them
   - Scope: what's explicitly in, what's explicitly out, whether this is one story or several bundled together
   - Acceptance criteria: concrete testable "done," happy path step by step, demo scenario QA/PO will test against
   - Dependencies & context: what this depends on (other stories/APIs/systems), design mockups/specs if they exist, what this blocks or unblocks
   - Data model/schema changes, source of truth, what happens to existing data if behavior changes
   - API/contract boundaries
   - Auth/permissions
   - Error handling & edge cases: error states/messages, loading/empty/success states, empty input/network failure/permission denied
   - **Scale target:** expected data volume, request rate/concurrency, latency budget — the numbers the implementation is sized for. Story states one → record verbatim. Silent → Material only when the change sits on a data- or request-dependent path (new query, loop over user data, hot endpoint); otherwise Cosmetic → assume "none stated — current scale assumed," log per 1.3. Not a mandate to optimize: sized-for-current-scale is a legitimate answer, *not knowing* is the failure. Step 2 sizes the plan against this line, Step 3.4 judges the diff by it.
   - Security/compliance requirements, device/browser/platform requirements
   - i18n/locale
   - Backward compatibility
   - Existing pattern to follow, or net-new

   Not every category applies to every story — skip the ones that obviously don't, ask only where the story leaves one genuinely open. Ask every genuinely vague item as its own question, one at a time — wait for the answer before asking the next. Never batch or combine, even when several categories look like the same unknown.

   **Ask order + stop rule** — one-at-a-time keeps answer quality; these keep the count bounded:
   - Order by tag (Material vs Cosmetic, per point 5 below — classify before asking, not after): Material first. Cosmetic gaps are "wrong guess costs nothing" by definition → assume and log per 1.3, don't spend a turn on them unless the user's still volunteering detail.
   - Stop as soon as the story is buildable and every remaining gap is Cosmetic or safely assumable — remaining items go to Assumptions as `unconfirmed`, not to another question.
   - Soft ceiling ~5 questions in one sitting. Hit it with Material items still open → stop asking anyway, log the rest as `unconfirmed` assumptions.
   - **Say it out loud when either stops the questions**, one line, before the gate: what you're assuming instead of asking, and that it needs owner confirmation — e.g. `Stopping questions here — assuming <X>, <Y> (logged unconfirmed). Flag if either's wrong.` Silent assumption is the failure mode this guards against, not the assumption itself.
3. User can't answer either (owner unavailable / genuinely undecided) → don't block. Log under Assumptions w/ reasoning, mark `unconfirmed`. Tell the user it needs owner confirmation before final; proceed anyway.
4. Classify story type now (table in Step 2.1 of `step2-plan.md`, don't wait for Step 2). `Bug fix` / `Copy/config/content change` = **lite**; everything else = **full**. State the mode, one line.
5. **Tag every open question/assumption**: Cosmetic (naming, location, formatting — wrong guess costs nothing) or Material (data model, API/contract, business logic, security, user-visible behavior — wrong guess = rework). Tag count — **not** step 4's type/size classification — decides the gate below. 10-task "New feature/subsystem," all-Cosmetic → gate merges. "Small feature," one Material unknown → gate stays separate. Task/file count belongs to Step 2.7, not here.
6. **Gate:** file exists → write Understanding Summary + Assumptions to it in one pass, trip marker. No file → present the same content in chat only. Understanding Summary always ends with one `Scale target:` line (point 2) — the assumed "current scale" form included, so a resuming session and the PR reviewer both know what the story was sized for.
   - **Zero Material unknowns** → fold Step 2 in: do Step 2's work silently (read `step2-plan.md`), present Understanding Summary + Plan together, one combined confirmation, both quoted verbatim. Regardless of story type/task count.
   - **Any Material unknown remains** (even `unconfirmed`) → summary alone, quoted verbatim, stop. No Step 2 until confirmed.

---

# Step 2 — Plan

*Lite mode skips this step.* Full-mode + zero Material unknowns (Step 1) → also skips the separate gate, folded into 1.6 instead. Decided purely by the Material count from 1.5 — never type, never task/file count. Large multi-file story, nothing genuinely unknown → merges just as readily as a small one.

Order matters here: everything that can *add* work (points 3-5) runs before the task breakdown (point 6), so tasks are cut once and the cap in point 7 is applied to the real list.

1. Classify from the confirmed Understanding Summary (already done, 1.4, for lite-eligible types; do it here otherwise). Ask the user only if genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | reported defect, "should do Y but does Z" | No HLD/LLD — root cause + fix approach |
   | Copy/config/content change | text, labels, flags, env values, constants | No design — straight to task list |
   | Small feature addition | new behavior in existing architecture, no new component | LLD only, skip HLD |
   | Refactor/tech debt | no behavior change, restructuring | LLD only, scoped to what's restructured |
   | New feature/subsystem | new capability spanning components | Full HLD + LLD |
   | New service/integration | new external dependency, new cross-system data flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resource usage, scaling | No design doc — profiling findings + targeted fix |

   Size doesn't classify — the Flow does. Type is about *what kind of change*; the file/task ceilings in point 7 catch a story that outgrew its type.

2. Discuss the approach at the depth classification calls for: HLD → system-design level (components, data flow, integration points). LLD → key functions/classes/schema. "No design" → name the fix approach, one-two sentences. Not a formal doc — enough to agree the shape before code. Same scoped-search rule as Step 1 ("Investigation scope" in `SKILL.md`) — chase the components the story actually touches, not the whole repo.
   - **Tripwire:** plan surfaces a Material unknown Step 1 missed → stop, resolve there (ask / log `unconfirmed` per 1.3 in `step1-understand.md`), before continuing. Applies even when 1+2 merged — a bad merge decision surfaces here, doesn't get built around.
   - **Architecture decisions:** 2+ valid approaches exist → pick one, state why, write it down (Plan section of the context file, or the chat message if no file yet) — not left as an unstated call in your head. Cross-team surface (FE/BE split) → agree the contract (API shape, request/response, error codes) before either side's tasks start.
   - **Risks/unknowns:** distinct from Step 1's Material/Cosmetic tags (those are about the story's *requirements*; this is about *implementation* risk) — flag parts you're unsure how to implement, parts touching unfamiliar code, anything needing a spike/research before real work starts, anything that could break existing functionality. Genuinely open → same tripwire handling as a Material unknown (ask, or log `unconfirmed` and proceed). Recorded, not just said — see point 9.

**Depth gate for points 3-5** — single source of truth for how much of the next three points runs. Points 3-5 don't restate it.

| Design depth | Points 3-5 |
|---|---|
| No design (copy/config, performance, bug fix reaching here via escalation) | Skip 3 and 4 — the one regression case that proves the fix is enough. Point 5 only if the story itself touches prod data/payments/migration. |
| LLD only (small feature, refactor) | Point 3: the single domain the story touches, folded into point 2's discussion — no table walk. Point 4: one line. Point 5: only if schema/prod-data/payments involved. |
| Full HLD + LLD (new feature/subsystem, new service/integration) | All three explicitly, as written below. |

Story sits at a lighter depth but genuinely carries the risk (a "small feature" writing a migration) → the risk decides, not the label. That's a judgment call, not a reason to run the whole table.

3. **Domain-specific checks** — orthogonal to the Type table in point 1 (Type drives design depth/task caps; a story can span 0, 1, or multiple domains below). Identify which domain(s) the story touches; anything they surface goes into the approach (point 2) and, if it's work, into the task breakdown (point 6). Skip domains the story doesn't touch.

   **No re-asking.** Auth/permissions, error handling, backward compatibility and the scale target were already scanned in Step 1's taxonomy. Here they're checked against the *plan*, silently — a question only goes back to the user if the plan surfaces something Step 1's answer doesn't cover, and then it's a point-2 tripwire, not a fresh round of questions.

   **Scale target check** — runs at every design depth in full mode, not just Full HLD (it's one fragment, doesn't scale with story size; lite never reaches here, Step 3.4's diff scan covers it there). Take Step 1's `Scale target:` line and walk the plan's data- or request-dependent paths — each new query, each loop over user data, each call added to a hot path — asking whether it holds at that target. Holds → one fragment in the approach saying how ("paginated, indexed on `user_id`"). Doesn't, or can't tell → point-2 tripwire: change the approach, or log it under Risks/Unknowns as open. "Current scale assumed" is still a target: the check is then that nothing in the plan gets worse than what's there today. This is sizing, not optimizing — a plan that holds at the stated target is done, however simple.

   | Domain | Checks |
   |---|---|
   | API/backend | Request/response contract defined (fields, types, status codes) — feeds point 2's cross-team contract; auth/permission requirements clear; rate limiting/throttling considered; idempotency needed (safe to retry without side effects); versioning impact on existing consumers; expected load/concurrency where it changes the design |
   | Mobile app | Offline behavior defined; platform differences (iOS vs Android behavior/UI); app store review implications if UI/permissions change; battery/data usage impact if polling or background work involved |
   | Database/schema | Migration is backward-compatible during deploy, reversible or rollback plan exists — feeds point 5; impact on existing queries/indexes considered; backfill needed for existing records; data volume at expected scale |
   | Bug fix (full-mode form, reached via a lite→full escalation; the same four checks run inline at the lite collapsed gate — see "Lite mode" in `SKILL.md` — so a plain bug fix never skips them) | Root cause understood, not just the symptom; repro steps confirmed; checked whether the same defect exists elsewhere before patching one spot; regression test added — feeds point 4 |
   | Infra/DevOps | Uptime/downtime impact known; monitoring/alerting updated if new failure modes introduced; cost impact considered (new resources, scaling); change is scriptable/repeatable, not a manual one-off |
   | Data pipeline/ETL | Source data reliability/format assumptions validated; failure handling defined for a batch failing midway; reprocessing/backfill strategy exists; downstream consumers identified |
   | Third-party integration | Rate limits and pricing of the third-party API known; failure/downtime handling for when the third party is unavailable; auth/credential management approach clear; webhook vs polling decision made |
   | UI-only/design (no backend change) | Responsive behavior across breakpoints confirmed; accessibility (contrast, keyboard nav, screen reader) considered; design system components reused, not one-offs |

4. **Testing plan:** identify which logic needs unit test coverage, list the manual/integration test cases (including the edge cases already surfaced in Step 1's error-handling taxonomy item and any domain-specific regression case from point 3), and confirm there's a clear way to verify the result against Step 1's acceptance criteria. Test work that's substantial enough to stand alone becomes its own task in point 6.

   **Scale target with a number and a way to measure it** (existing benchmark, load script, query plan, timing assertion) → one case names it, same what-runs / what-passing-looks-like form as the rest. No way to measure → say so here, one fragment: Step 3.4's diff scan is then the only check, and the user learns that now rather than at the PR.

   **Listed to be run, not to be filed.** Step 3 executes this set — its point 4 per task, its point 8 as a whole before the gate — so each case states what gets run and what passing looks like, and names the task(s) it covers. A case mapped to no task means a missing task or a case that doesn't belong here; a task covered by no case means Step 3.4 falls back to the repo's own checks, which is a weaker verdict — decide now whether that's acceptable, rather than discovering it mid-implementation.

5. **Rollout & rollback** — only for stories that touch production data, payments, or require a migration/backward-compat path (New service/integration is where this is most often mandatory; the Database/schema domain always needs it; other types only if the story itself says so): decide whether a feature flag is needed, address migration/backward-compatibility concerns, and confirm a rollback plan exists. Flag/migration/backfill work is real work — it becomes tasks in point 6, not a footnote.

6. Agreed → break into small tasks along natural seams: dependency order first, then component/layer (multi-part work) / file-module boundary (refactors). For multi-layer stories, make the layers explicit — frontend (components, state, routing), backend (endpoints, business logic), data layer (schema changes, migrations), integration points (third-party APIs, other services) — only the layers the story actually touches. Scoped right = one Task Log entry (one What + one Why, no "and also"), ≤3 files. Otherwise: split further. Everything points 3-5 surfaced is already on the table by now — nothing gets appended after the cap check below.
   - **Flow:** the ordered file/module list across all tasks = the story's **Flow** — the set of files this story is expected to touch, and in what order. Derived directly from the task breakdown, no extra thinking. Decided here, at planning, not revisited unless a Scope Change amends it.
   - **Sequencing:** note which tasks have no shared dependency (safe to reorder or hand off separately) and the smallest slice of the task list that would be independently shippable/demoable, if one exists — informs how Step 3 can be checkpointed. Recorded, not just said — see point 9.

7. Cap total tasks by type — ceiling, not target, applied to the finished list from point 6:

   | Type | Max tasks | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — likely misclassified |
   | Small feature | 5 | reconsider — may be "new feature/subsystem" |
   | Refactor | 8 | acceptable upper bound |
   | New feature/subsystem | 10 | **stop, flag** — propose splitting before Step 3 |
   | New service/integration | 10 | same — flag before implementing |
   | Performance | 5 | more usually means multiple bottlenecks — separate stories |

   **Flow size check:** per-task file cap (point 6) × task cap above compounds to 30 files worst case, uncapped independently of the task-count flag. Flow nearing ~30 distinct files → flag, propose splitting, before Step 3 — same treatment as hitting the task ceiling. A "Small feature" whose Flow runs past ~8 files is the early signal of the same problem: raise it as a possible misclassification.

8. **Constitution check:** `.breadcrumbs/constitution.md` exists (see "Project constitution" in `context-file-mechanics.md`) → read it once here and check the *whole* plan against it — approach, domain checks, testing, rollout, tasks — before presenting. Runs last on purpose: the rules it holds ("retries carry an idempotency key," "migrations must be reversible") match content that doesn't exist until points 3-5. Conflict → same handling as the point-2 tripwire, resolve before continuing. No file → nothing to check, skip silently. Lite mode skips Step 2 but *not* this check — it runs inline at the collapsed Step 1+2 gate instead (see "Lite mode" in `SKILL.md`), because these rules are repo-wide and don't scale with story size.

9. File exists → one pass, writing: story type, design depth, HLD/LLD notes, architecture decisions, **Risks/Unknowns** (point 2), domain-check outcomes, scale-target outcome (point 3), testing plan, rollout/rollback notes, Flow, **Sequencing** (point 6), Task Checklist — each only where it applied. Risks and Sequencing are the two most expensive things to re-derive on resume; they don't get left in chat. No file → stays in chat.
10. **Gate:** trip marker if a write happened. Present plan + task breakdown, quoted verbatim. Stop, wait for confirmation before implementing (`step3-implement.md`).

---

# Step 3 — Implement

1. Work the Task Checklist one task at a time.
2. **Don't ask the user mid-task.** Use best judgment. Genuine judgment call (not mechanical) → log in Task Log's "Why." Changes what was agreed (contradicts plan, needs a scope decision) → not a solo call — log under Scope Changes, flag immediately.
3. Apply `ponytail` for how code gets written: simplest thing that works, stdlib/existing deps before new code, no unrequested abstractions. Exceptions still apply — never simplify away input validation, error handling, security, accessibility, or holding the story's scale target (Step 1): "simplest thing that works" means works at that scale, not on the dev fixture. A target of "current scale assumed" still means: don't make the path worse than it is today.
4. **Verify before checking the task off.** A task isn't done because the code is written — it's done when something demonstrates it works. This is the step that makes the Task Log a record of what was *proven*, not only what was decided.
   - Run the cases Step 2.4's testing plan mapped to this task (lite → the check named at the collapsed gate). Nothing mapped to it → run the repo's own fast checks over what you touched (the existing test file, typecheck, lint — whatever a contributor runs locally) and name which.
   - Genuinely nothing executable (copy change, doc edit) → say so, plus what you inspected instead. That's a valid verdict; silence isn't.
   - Fails → not a checkoff. Fix, re-run. Still fails and the cause is the plan rather than the code → that's the Mid-flight break in point 7, not a task checked off with a caveat attached.
   - **Self-review, same pass, before presenting:** re-read your own diff against the task's Why and the plan's approach — leftover scaffolding, a TODO standing in for the fix, a temporary workaround where the root cause was the point, an abstraction the task never asked for. Found something → fix it now; don't present it and wait to be told.
   - **Scale scan, same pass:** read the diff against the scale target for the patterns that break under growth — a query or network call per item of a collection that grows with data, an unbounded load into memory, a new query path with no pagination or index, synchronous work added to a hot path. Found, trivial, inside the task's scope → fix now, note it in `Verified:`. Found and not trivial, or the diff plainly can't hold the target → **not a checkoff**: that's the perf regression trigger in point 7. Nothing found → say nothing extra; the scan is silent when clean. Mirror of the manual-edit review in point 5, pointed at your own output.
   - Outcome carries into the Task Log (point 5) as `Verified:` — what ran, what it showed. That field is where Step 4's **Test** section comes from, so "no coverage found" in a PR draft can only mean this step reported it, never that nobody looked.
5. **Standing manual-edit review** — before starting each task, and on resume: `git status` / `git diff HEAD` over the story's files. Any change you didn't make is a user hand-edit. Review it, one line: correct against the task's Why and the plan's approach, or issue found (what, where). Then check the file against the story's Flow (Step 2.6) — off-Flow gets the extra line described below. It's a review, not a veto: the edit stands unless it breaks something, and you say so rather than silently re-editing it. The verdict is the `Check:` line; the pattern check ("Learning from the edit", below) runs on the same pass.

   After each task — file exists → append Task Log entry (`Verified:` from point 4 included, all three forms), check it off, same write, trip marker. Either way: tell the user what was done, next task without waiting unless interjected. Genuine judgment call → full What/Why block; mechanical → single checklist line; user edited the file by hand (per the standing manual-edit review) → checklist line + one-line `Check:` verdict, same review that's already shown in chat, logged here too. Edited file isn't on the story's planned Flow (from Step 2.6) → say so explicitly before the correctness verdict ("that file's outside this story's planned Flow — [reason if evident]"), one line, non-blocking; still record the `Check:` verdict either way (`context-template.md` has all three forms). Quote whichever form was written, don't restate. No file, no trigger yet → just narrate progress in chat, including the manual-edit check and any Flow warning.

   **Learning from the edit:** if the hand-edit reflects a repo-wide preference rather than a one-off fix to this task (e.g. consistently strips comments a certain way, always adds a specific guard, renames a pattern the same way each time) → treat it like a stated rule (`context-file-mechanics.md`'s Project constitution trigger): ask once, "Noticed you always change X to Y — save that as a standing project rule?" Confirmed → append to `.breadcrumbs/constitution.md`, apply it from the next task onward in this story and every story after. Declined → don't ask again for this same pattern, keep it to the `Check:` verdict only. Story-specific edit (fixes this task's particular bug, not a general preference) → no ask, `Check:` verdict is enough. The same ask covers a correction the user only *says* and never edits, when it repeats or is plainly repo-wide — see the Project constitution triggers in `context-file-mechanics.md`.
6. **Commit each task**, right after its Task Log write (same moment, before moving to the next task). One commit per completed task — mirrors the Task Log 1:1, keeps `git log` and the Task Log reconstructable from each other.

   Per-task, not per-story, on purpose: each commit carries that task's own Why. Batch several tasks into one commit and the reasons collapse — a reviewer can see the change belongs to the story, but not which reason drove which hunk. That's the thing being preserved; it can't be recovered later.

   Conventional Commits format: `<type>(<scope>): <imperative summary>`. Scope = affected module/file area, omit if obvious from a small story. Body = short bullet list, drawn from the task's What/Why — compress, don't paste the Task Log entry verbatim.

   | Type | Use for |
   |---|---|
   | `feat` | New feature |
   | `fix` | Bug fix |
   | `docs` | Documentation changes |
   | `style` | Code style changes (formatting, no logic change) |
   | `refactor` | Code refactoring, no behavior change |
   | `perf` | Performance improvement — behavior unchanged, characteristics (speed, memory) improved |
   | `test` | Adding or modifying tests |
   | `chore` | Maintenance tasks, tooling, deps |
   | `revert` | Undoing a task's commit (Step 3.7 owner drop / Scope Change) — `revert(<scope>): <what was undone>`, reverted hash in the body |

   Example:
   ```
   feat(auth): add password reset functionality

   - Add forgot password form
   - Implement email verification flow
   - Add password reset endpoint
   ```

   Reverting a task (owner drops the requirement, Step 3.7) → `git revert <that task's commit>`, then rewrite the header to the `revert` form above — git's default `Revert "..."` header doesn't pass the validator, and the reason (why it was dropped) goes in the body, drawn from the Scope Changes entry.

   Scope change / mid-flight fix mid-task → still one commit for the task once it lands, type reflects what actually shipped (e.g. a task that started as `feat` but the scope change made it fix a bug too → `fix` if that's now the dominant change).

   Before running `git commit`, check the header with `validate-commit-message.mjs` — deterministic, cheaper and more reliable than eyeballing the regex. Resolve the script per "Validator scripts" in `context-file-mechanics.md`; not found → check by hand against the table above, don't block on it.
7. Test fails / owner invalidates an assumption / scope changes mid-flight / **perf or scale regression surfaces** (a planned case shows a slowdown, or point 4's scan finds a pattern that won't hold at the scale target) → Mid-flight break trigger (`SKILL.md`) applies. Once handled: structured Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update relevant Assumptions/Plan, adjust Task Checklist. Continue in the same file. Perf case: tell the user immediately, in one line — what regressed, against which target, what it would take to hold it — before fixing or working around it. Before/After in the entry names the target and the pattern that broke it. The regression is the user's call to absorb or fix; it's never a silent fix, and never a silent ship.
8. **Gate:** every task checked off → **run the whole planned test set now**, not just point 4's per-task checks: every case Step 2.4 listed (lite → the check named at the collapsed gate), plus the repo's own suite over what the story touched. Per-task verification proves each task in isolation; this proves they compose — the failure it exists to catch is task 5 breaking what task 2 established, which no per-task run can see.
   - Green → summarize what was built *and what proved it* (one line: cases run + outcome), plus the scale target it holds and whether that was measured or only scanned (one fragment), stop, wait for confirmation before PR (`step4-pr.md`).
   - Red → not a gate to pass with a note attached. Fix, re-run; cause is the plan rather than the code → point 7's Mid-flight break. Never present a story as ready with a known-failing case.
   - Nothing runnable for the whole story → say that explicitly at the gate, with what was checked instead. Goes to the user as a fact about the story, not as a silence.

   Commits for all tasks already exist by this point — Step 4 drafts the PR description, it doesn't create new commits. A fix made *here* is its own commit and its own Task Log entry: the Log stays 1:1 with `git log`, and "integration caught something the task-level run didn't" is itself worth preserving.

---

# Step 4 — PR

1. Tell the user the work is ready for a PR.
2. Title: file exists → derive from it (`<Ticket ID/slug>: <imperative summary>`, file header + Understanding Summary). No file → compose the same way from the conversation. Ticket has a URL (in the pasted story, the file header, or the tracker convention is known) → link the ID in the heading; a bare ID is a search for whoever reads this from `git blame` in a year.
3. **Two readers, not one:** the reviewer today, and whoever blames a line into this PR months later with no chat to consult. Every section below is judged by whether it tells one of them something the diff can't.

   Five core sections, same names regardless of type — **What, Why, Test, Rollback, Dependencies** — plus two optional one-liners (**Reviewer focus, Out of scope**) and one addendum that only exists on a re-draft (**What changed since last PR**). Bias toward fewer: include a section only if it earns its place, omit rather than pad. File exists → pull content from it, don't re-summarize; no file → derive the same from the conversation.
   - **What** — always. The *behavior change*, not the problem and not the file list: what the system does differently now. The diff already shows which files moved; the problem belongs in Why. ← Task Log "What" entries, concatenated.
   - **Why** — always, unless it'd just restate What (trivial copy/config fix) — then drop it. The section the diff cannot carry: root cause or constraint, and the alternative that was considered and rejected, one fragment each. Naming the rejected approach saves a review round more often than anything else here. ← Task Log "Why" entries, Assumptions, Scope Changes — only where they add something What didn't.
   - **Test** — what actually verified it, *with the outcome*: the cases run at Step 3.4/3.8 and what they showed, manual repro steps, or "nothing runnable" + what was inspected instead. Skip only when genuinely nothing to verify. ← Task Log `Verified:` lines and the Step 3 gate's full run — **not** the Plan's testing notes, which say what was intended; a reviewer reading "unit tests for the retry path" needs to know they ran, not that they were planned. Verification reported none → say that, don't invent. Scale target stated at Step 1 → one fragment here: the target, and whether a case measured it or Step 3.4 only scanned for it — the reviewer should know what scale this was sized for without opening the ticket.
   - **Rollback** — only if reverting isn't a plain revert (migration, feature flag, external state, data backfill). ← Plan/Scope Changes, only where flagged.
   - **Dependencies** — only if this PR depends on or blocks something else, including sitting on top of another unmerged branch. ← Assumptions/Plan, only where flagged; branch dependency ← `git merge-base HEAD <default-branch>` isn't `<default-branch>`'s tip → this branch is stacked, name the base branch, note it needs merging first.
   - **Reviewer focus** — optional, one line. Only when the diff has an uneven shape: one hunk carries the judgment call and the rest is mechanical (rename, generated file, moved code, formatting). Name where to read first and what can be skimmed. Diff is uniformly small or uniformly substantive → omit, it'd only say "read all of it". ← Task Log: the entries with a full What/Why block vs. the single-line mechanical ones.
   - **Out of scope** — optional, one line. Only when a reviewer would plausibly ask "why didn't this also…": a related defect seen and left, a follow-up already filed, a boundary drawn on purpose. Name the thing and where it went (ticket, later PR, deliberately never). ← Assumptions marked out of scope, Scope Changes that narrowed, Step 2 "not in this story" notes. Nothing was deferred → omit.
   - **What changed since last PR** — later-update case only. ← Scope Changes dated after the last PR Summary write.
4. **Cap every included section at 2 lines, except Why at 3** — Why is the one section that carries reasoning rather than facts, and root cause + rejected alternative rarely fit in two. Pulled content runs long — compress to the essential point(s), don't truncate mid-sentence. Can't fit without losing something needed → signal the task/decision was too broad, not a reason to break the cap. **Whole draft should read in 2-5 min.** Runs longer with every section already trimmed and only the earned ones kept → the story was too big for one PR, say so instead of shipping a wall of text.

   Never: restate the diff, narrate the journey ("first I tried…"), list the commits, or leave a heading in with nothing under it. Those are the four things a reviewer skims past, and the empty heading trains them to skip the section next time it's real.

   Template:
   ```markdown
   ## [<Ticket ID>](<ticket URL>): <imperative summary>

   **What:** <line 1>
   <line 2, only if needed>

   **Why:** <root cause / constraint>
   <rejected alternative, only if one was weighed>
   <line 3, only if needed>

   **Test:** <line 1>

   **Rollback:** <only if non-trivial>

   **Dependencies:** <only if any>

   **Reviewer focus:** <only if the diff is uneven>

   **Out of scope:** <only if something was deliberately left>
   ```
   Example (bug fix — Rollback and Dependencies both omitted, plain revert, none; Reviewer focus and Out of scope both earned):
   ```markdown
   ## [PARK-482](https://tracker.example/PARK-482): Fix duplicate charge on payment retry

   **What:** Retries now reuse one idempotency key generated per order, so the provider sees a single charge across the whole retry sequence.

   **Why:** Retries omitted the key, so the provider treated each one as a fresh charge.
   Considered de-duplicating on our side by order ID; rejected — provider-side idempotency is the contract, and a local check still races across two workers.

   **Test:** Regression test simulates a retried request, asserts a single charge — passes; provider-retry suite green.

   **Reviewer focus:** `retry.ts` key generation is the judgment call; the `charge.ts` change only threads the key through.

   **Out of scope:** Webhook replays can also double-charge — separate root cause, filed as PARK-490.
   ```
5. **Show the draft directly in chat, stop there.** Not a file draft awaiting a later write — the deliverable itself. No way to open a PR on GitHub/GitLab/Bitbucket → the chat message *is* the artifact, user copies it into the platform's PR field. Nothing written to the context file here — no later gate reads a stored PR summary back.
6. **Gate:** confirm or request changes, iterate in chat, until happy with what they'll paste.
7. Confirmed + file exists → write one line to PR Summary: `Last drafted: <date>` (anchor for diffing Scope Changes later, not a text copy). Update Status to `pr-ready`, same pass. Trip marker. No file → nothing to write, chat draft was the whole deliverable.

---

# breadcrumbs context file — template & guardrails

Read once per story, at file creation — whichever trigger fires it (see "The context file" in `SKILL.md`). Not needed again on resume — the file itself has everything by then — nor if no trigger ever fires.

## Content style

Read by AI only (this session, a resumed session, another platform) — never the user. `SKILL.md`'s "Communication style" governs chat, not this. Every section: fragments, not sentences. Drop articles/connective words where meaning stays unambiguous. Abbreviate freely. Optimize for a resuming model re-deriving state fast, not human readability.

- Prose: `Why: We added a mutex because there was a race condition between the two writers.`
- Telegraphic: `Why: race condition (two writers) — added mutex.`

Markdown structure (headers, lists, checkboxes) stays as-is — parsing scaffolding, not prose. Cutting it costs more to re-derive than it saves.

## File structure

```markdown
# <Story title / ticket ID>
Status: understanding | planning | implementing | pr-ready | done

## Original Story
<verbatim paste>

## Understanding Summary
<Claude's restated understanding, confirmed by user on <date>>
Scale target: <volume / rate / latency budget the story is sized for — or "none stated — current scale assumed". Step 2 sizes the plan against it, Step 3.4 judges the diff by it.>

## Clarifying Q&A
- Q: ... — A: ...

## Assumptions
- <assumption> — reason: <why> — status: unconfirmed | confirmed by <who> on <date>

## Current Requirements
<the story's requirements as they stand right now, amended in place as scope changes land — this is the "what's true today" view, kept short and current, never a history log>

## Plan
Story type: <bug fix | copy/config | small feature | refactor | new feature/subsystem | new service/integration | performance>
<approach discussion, HLD/LLD notes if that depth applies, agreed on <date>>
<architecture decision(s): chosen option — why, rejected option(s) — why not. Only where 2+ valid approaches existed.>
<domain-check outcomes / scale-target outcome (holds — how; or open risk) / testing plan / rollout+rollback notes — only the ones that applied, one fragment each.>

### Risks / Unknowns
- <implementation risk — unfamiliar code, possible breakage, needs a spike> — status: open | resolved: <how>

### Sequencing
<tasks with no shared dependency (safe to reorder/hand off); smallest independently shippable slice, if one exists. Omit section if neither applies.>

## Flow
<ordered list of files/modules this story is expected to touch, derived from the task breakdown — e.g. "1. src/foo.ts (Task 1)  2. src/bar.ts (Task 2, 3)". Amended only via a Scope Change entry below, never edited in place.>

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
- Flow: <on plan | off plan — reason if evident. Only present when the edited file isn't on the story's Flow above.>

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
Last drafted: <date> — full text was shown in chat for the user to copy into GitHub/GitLab/Bitbucket, not duplicated here. Kept only as the anchor for diffing "what changed since last PR" on a later update.
```

Append, never overwrite — except `Status`, Task Checklist checkboxes, Current Requirements, and a Risks/Unknowns entry's `status:` field: amended in place as they change. Everything else (Scope Changes, Task Log, Assumptions) = running record, add entries, never rewrite past ones. Split → resuming session sees both "what's true now" (Current Requirements) and "how we got here" (Scope Changes) without re-deriving one from the other.

Three Task Log forms — classification per Step 3.5, shown concretely in Task 1/2/3 above. No prose without a decision or a check behind it.

`Verified:` — on all three forms, no exceptions (Step 3.4). What ran and what it showed, one fragment. An entry without it reads to a resuming session as a task nobody proved, which is exactly what it is. "Nothing runnable" is a legitimate value; an absent line isn't.

`Flow` — defined Step 2.6, flagged when violated per Step 3.5. Recorded as a `Flow` line here (Task 3 example above).

## What NOT to do

- Don't skip a gate on your own initiative, next step "obvious" or not. Applies in lite mode too. Only an explicit user waiver skips one — see "User override" in `SKILL.md`, and log it under `Gate Waivers` below.
- Don't ask the user questions during Step 3 task execution — decide, log, move on. Exception: scope-changing issues, surface those immediately.
- Don't check a task off without a `Verified:` line, and don't pass the Step 3 gate with a known-failing case. "Tests exist" isn't verification; "tests ran, here's the outcome" is.
- Don't overwrite past entries — running record, not a snapshot.
- Don't commit the context file or reference it in the PR diff.
- Don't delete it unless the user confirms the PR merged.
- Don't let a lite-mode story silently absorb a scope change or failed test — that's what the escalation trigger (see "The context file" in `SKILL.md`) is for. Escalate to full mode rather than tracking it in chat memory alone.
