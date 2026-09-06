# breadcrumbs regression scenarios

Not an automated suite — this is a prompt-following skill, there's no deterministic output to assert on. Run these by hand (in a scratch repo) after any edit to `SKILL.md` or a step file, before trusting the change. Each scenario lists the prompt to give and what a correct run looks like — if actual behavior diverges, the edit broke something.

## 1. Lite mode, single sitting — no context file expected

**Prompt:** paste a one-line bug report, e.g. "Login button submits twice on double-click, causing duplicate API calls."

**Expect:**
- Classified `lite` (bug fix), stated in one line.
- Step 1 + Step 2 collapse into one message: understanding + task list (≤2 tasks) + **the check that will prove it** + "confirm?"
- **Bug-fix checks appear inline in that collapsed message** (four fragments, not a design doc): root cause named — not "add a disabled flag" as an end in itself but *why* the second submit gets through; repro confirmed; same defect looked for elsewhere (other double-submitting buttons); regression case named. A run that jumps straight to a task list has regressed.
- On confirm: tasks implemented, one commit per task (`fix(...): ...` header), no per-task chat message beyond progress narration.
- **Each task verified before checkoff** — the named check actually run, outcome stated. Not "added a test"; "ran it, passes."
- One wrap-up message after all tasks, not per-task — and the wrap-up names what proved it, not just what was built.
- **No `.breadcrumbs/context/` file created** — no trigger fired (single sitting, no stop/break/topic-shift).
- PR draft on request: five-section template, only earned sections included.

## 2. Full mode, stop signal, resume in a new session

**Prompt A (session 1):** paste a small-feature story (e.g. "add a CSV export button to the reports page"), go through Step 1 confirm → Step 2 confirm → complete one task, then say "let's continue tomorrow."

**Expect (session 1):**
- Classified `full` (small feature), Step 1 and Step 2 gated separately (unless zero Material unknowns).
- Context file created at the stop signal — trip marker shown, backfilled Understanding/Plan/Task Checklist/Task Log for the one completed task.
- One commit made for the completed task, Conventional Commits format.

**Prompt B (session 2, fresh context):** "let's continue the CSV export story."

**Expect (session 2):**
- Finds the single matching file in `.breadcrumbs/context/`, reads it, summarizes status back ("here's where this stood... currently at Step 3, task 2 of N").
- Resumes at the next unchecked task — doesn't redo Step 1/2.

## 3. Mid-flight scope change — lite escalates to full

**Prompt:** paste a bug-fix story (lite-eligible), confirm the collapsed Step 1+2, then mid-implementation say "actually this needs to handle the retry case too, not just the double-click" (a scope change, not just a detail).

**Expect:**
- Context file created now if it didn't already exist (mid-flight break trigger), even though this started as lite.
- Escalates lite → full, said in one line.
- Structured Scope Changes entry: date, trigger, before/after, affected tasks, why.
- Current Requirements amended in place (not appended as a duplicate).
- Task Checklist adjusted for the new scope.
- Story continues in the same file — doesn't restart Step 1.

## 4. Project constitution — captured, then enforced

**Prompt A:** mid-story (any full-mode story), state a repo-wide rule: "by the way, every API endpoint in this repo needs a rate limiter, not just this one."

**Expect:**
- Recognized as repo-wide, not story-specific → asks once to save it as a standing rule.
- Confirmed → creates `.breadcrumbs/constitution.md` if missing, appends the rule with rationale + date. **Not** added to `.gitignore` (this file is meant to be committed, unlike per-story context files).

**Prompt B (new story, same repo):** paste an unrelated feature story that adds a new endpoint.

**Expect:**
- Step 2 reads `.breadcrumbs/constitution.md`, checks the plan against it before presenting.
- Plan doesn't already include a rate limiter → surfaced as a conflict, resolved before the plan is presented for confirmation (same handling as the Step 2.2 tripwire).

## 5. Mid-session requirement drop — revert just that task

**Prompt:** mid-story (full mode), after a task implementing some requirement X is already committed, say "actually, requirement X isn't needed — I don't like this implementation, revert it."

**Expect:**
- Recognized as a Step 3.7 trigger (owner invalidates a requirement/assumption, scope changes mid-flight) — context file created now if it doesn't exist yet.
- Revert is scoped to *that task's own commit* — `git revert <task's commit hash>`, not a hand-picked diff. Commit header rewritten to `revert(<scope>): ...` (the `revert` type in Step 3.6) so it passes `validate-commit-message.mjs`; git's default `Revert "..."` header fails it. Only possible cleanly because Step 3.6 commits one task per commit; a story implemented as one big commit would force picking lines out of a mixed diff instead.
- Structured Scope Changes entry logged: trigger (owner decided X unnecessary), before (had X), after (X removed), affected tasks, why.
- Current Requirements amended in place — drops X, doesn't leave it contradicting the Task Log.
- Task Checklist updated for the dropped task — **not silently deleted**: the Task Log keeps the record that X was built, then explicitly reverted, and why. A later reader (different session, teammate, different AI) sees a deliberate decision, not a gap that looks like something got forgotten.
- Story continues from the remaining Task Checklist — doesn't restart Step 1/2, doesn't re-touch other tasks' commits.

**Why this matters (not just a mechanical check):** without per-task commits and a Scope Changes log, both halves of this fail silently — the revert boundary is fuzzy (one commit holds several requirements, so reverting requires picking lines by hand and risking scope bleed into unrelated changes), and the reason disappears (a bare `git revert` says *that* something was undone, never *why* — six commits later, "did we forget X or decide against it?" has no answer without re-deriving it from memory).

## 6. PR draft — stacked-branch dependency

**Setup:** in the scratch repo, create and check out a branch off the default branch (e.g. `feature/base`), commit something, then branch again off *that* (e.g. `feature/on-top`) without merging `feature/base` back. Run a small-feature story to completion on `feature/on-top`, reach Step 4.

**Expect:**
- `git merge-base HEAD <default-branch>` isn't `<default-branch>`'s tip → recognized as stacked.
- PR draft includes a **Dependencies** section: names the base branch (`feature/base`), states it needs merging first.
- No other section changes — What/Why/Test/Rollback follow their usual inclusion rules independent of this.

**Contrast check:** re-run a normal story on a branch cut directly from the default branch — **Dependencies** section stays omitted, same as before this change.

## 7. Verification gate — a task can't be checked off unverified

**Prompt:** run a small-feature story (full mode) with a testing plan agreed at Step 2.4, then during Step 3 watch the first task complete.

**Expect:**
- Before the task is checked off: the Step 2.4 case(s) mapped to *that task* are run, outcome stated in chat.
- No case mapped to it → falls back to the repo's own fast checks over the touched files, and **says which** ("ran `npm test -- reports/`").
- Task Log entry carries a `Verified:` line on whichever of the three forms applies — including the mechanical single-line form.
- At the Step 3 gate: the **whole** planned set runs again, plus the repo suite for what the story touched — not just a re-summary of the per-task runs. Wrap-up names cases run + outcome.
- `node .../validate-context-file.mjs .breadcrumbs/context/<slug>.md` passes.

**Negative check (the regression this exists to catch):** hand-edit the context file to delete a `Verified:` line from one Task Log entry, re-run the validator → **FAIL**, naming that entry. Silent pass means the check isn't wired.

**Failure-path check:** make one planned case fail (break the code under it). Expect: task **not** checked off, fix + re-run, no "checked off with a caveat." Cause is the plan rather than the code → Step 3.7 Mid-flight break instead, not a checkoff.

## 8. Lite mode still reads the constitution

**Setup:** `.breadcrumbs/constitution.md` exists with an active rule that a lite change can violate — e.g. `- No user identifiers in log lines — rationale: PII — added <date> — status: active`.

**Prompt:** a copy/config story that adds a log line including a username, e.g. "log the username on failed login so support can trace it."

**Expect:**
- Classified `lite`, Step 2 skipped as usual — **but the constitution is still read and checked**, inline at the collapsed gate.
- Conflict surfaced before the gate message asks for confirmation, handled like a Step 2.2 tripwire — resolved, not built around.
- A run that implements it as asked because "lite skips Step 2" is the regression.

**Contrast check:** no `.breadcrumbs/constitution.md` present → no mention of it at all, gate message unchanged from scenario 1. The check is silent when there's nothing to check.

## 9. Constitution trigger — a correction that never becomes an edit

**Prompt:** mid-story, correct the same class of thing twice in chat without touching any file yourself — e.g. after task 1, "don't log the raw token there"; after task 2, "again — no raw tokens in log lines."

**Expect:**
- Second correction → asks **once** whether to save it as a standing project rule (same wording as the stated-rule and hand-edit triggers).
- Confirmed → appended to `.breadcrumbs/constitution.md`, active, with rationale + date; applied from the next task onward.
- Declined → not asked again for this pattern; recorded under this story's Assumptions instead.
- Never appended silently on the strength of the corrections alone.

**Contrast check:** a single one-off correction specific to one task ("that variable name is wrong here") → **no** ask. It's a Task Log `Why`, not a rule. Asking on every correction is as much a regression as never asking.

## 10. Windsurf — router fits the cap, reference files get read

Windsurf enforces a hard per-file cap on workspace rules and **truncates past it silently**. The
inlined build was 52,480 chars against a 12,000 cap, so Windsurf received roughly the router and
Step 1 — no gates, no Step 3, no template — with no error anywhere. Windsurf therefore ships as a
router plus repo-relative pointers.

**Build check (deterministic, run on every edit to `SKILL.md`):**
- `node scripts/build-platforms.mjs` → `.windsurf/rules/breadcrumbs.md` is under 11,000 chars.
- Same run leaves `~/.claude/skills/breadcrumbs/` untouched (mtimes unchanged); only `--install` writes there. An unknown flag (`--instal`, `--profile lean`) throws instead of silently building defaults.
- Pad `SKILL.md` past the cap and re-run → **build throws**, naming the size and the cap. A silent
  pass here is the original bug returning; the whole point of the guard is that it's loud.
- Every reference pointer inside the file reads `skills/breadcrumbs/<file>.md`, not a bare filename —
  Windsurf has no skill-directory resolution, so a bare name resolves to nothing.
- Other platform files are byte-identical (this change is Windsurf-only).

**Behavioural check (run by hand, in Windsurf, on a scratch repo):**
- Paste a small-feature story. Cascade activates the rule on description match.
- At the Step 1 gate it **reads `skills/breadcrumbs/step1-understand.md`** before asking questions —
  the taxonomy is in that file, not in the rule.
- At Step 2 it reads `step2-plan.md`; at Step 3, `step3-implement.md`; on first context-file write,
  `context-file-mechanics.md` + `context-template.md`.
- The gates themselves, lite-mode rules, and the verification requirement come from the rule text
  and hold **even if a reference read is skipped** — that's the tiering. Losing `step2-plan.md`
  costs plan depth; losing a gate would be a different failure, and must not happen.

**The regression to watch for:** Cascade never reads any reference file and improvises step content
from the router alone. Symptom is plausible-looking output with no taxonomy, no domain checks, and no
Task Log format. If that shows up, the lean profile isn't safe on Windsurf and the trade needs
revisiting — not more pointer wording.

## 11. Lean profile — pointers get followed, or they don't

Cursor, Cline, Kiro, Copilot and Gemini ship the router with repo-relative pointers instead of the
inlined text (~1.9k tokens instead of ~10.8k). This scenario exists because that saving is only real
if the agent actually reads the pointed-at files.

**Build checks (deterministic):**
- Default build == `--profile=lean`; `--profile=full` restores inlining; `--profile=medium` fails.
- Every lean file still contains the gates, "never skip a gate", lite-mode rules, verification
  (3.4/3.8), Mid-flight break and User override — the tier that must survive a skipped read.
- Every pointer reads `skills/breadcrumbs/<file>.md`; zero bare filenames.
- `AGENTS.md` full under both profiles; `.windsurf/...` lean under both.
- `.gemini/commands/breadcrumbs.toml` still parses as TOML (the body is embedded in a `"""` string,
  so a stray triple-quote would silently corrupt it).

**Behavioural check — run once per platform, on a scratch repo:**
Paste a small-feature story and watch whether the reference file is read at each gate.

| Gate | File that must be read |
|---|---|
| Step 1 | `skills/breadcrumbs/step1-understand.md` |
| Step 2 | `skills/breadcrumbs/step2-plan.md` |
| Step 3 | `skills/breadcrumbs/step3-implement.md` |
| Step 4 | `skills/breadcrumbs/step4-pr.md` |
| First file write | `context-file-mechanics.md` + `context-template.md` |
| Resume with files present | `skills/breadcrumbs/resume.md` |

**Pass:** the files are read at the gate, and behaviour matches the same story run on Claude Code.

**Fail:** plausible-looking output with no Step 1 taxonomy, no Step 2 domain checks, no Task Log
format — the agent improvised from the router alone. That platform goes back to `--profile=full`;
it is *not* fixed by rewording the pointers.

**Partial:** gates and lite-mode rules hold but plan depth is thin. That's the designed degradation,
not a failure — record it and decide per platform whether the token saving is worth it.

## 12. Scale target — captured at Step 1, a regression against it is a break, not a checkoff

**Prompt A:** paste a small-feature story that adds a data-dependent path but says nothing about scale, e.g. "show each customer's last five orders on the admin customer list."

**Expect (Step 1):**
- The taxonomy scan raises the scale target as **Material** (new query on a list path), asks one question — roughly "how many customers does this list page render, and is there a latency budget?" — not a generic "any performance requirements?"
- Answered or not, the Understanding Summary ends with one `Scale target:` line. Unanswered → `none stated — current scale assumed`, logged `unconfirmed`, said out loud per the stop rule. A summary with no such line has regressed.

**Expect (Step 2):**
- The approach carries one fragment saying how the plan holds at that target ("one batched query for the page's customer ids, not one per row").
- Testing plan either names a measurable case (query count assertion, timing) or says in one fragment that nothing can measure it and Step 3.4's scan is the only check.
- **No** separate performance domain row, no benchmark task added on its own initiative — this is sizing, not optimizing.

**Prompt B (Step 3):** let the implementation of the data-fetch task land as a per-customer query inside the render loop (or hand-edit it into that shape).

**Expect:**
- Step 3.4's scale scan names the pattern (query per item of a collection that grows with data) before the task is checked off.
- Trivial to fix inside the task → fixed, noted in `Verified:`. Not trivial, or the target genuinely can't be held → **not checked off**: one line to the user first — what regressed, against which target, what it would take to hold — then a Scope Changes entry whose Before/After names the target and the pattern. Context file created now if none existed (mid-flight break); lite would escalate to full here.
- Gate summary and the PR's **Test** section both name the target and say whether it was measured or only scanned.

**Contrast check:** a copy/config story (lite) → no scale question asked, `Scale target: none stated — current scale assumed` appears without ceremony, Step 2's check never runs, Step 3.4's scan still runs and stays silent on a clean diff. A lite story that gets a scale question, or a full story whose PR omits the target, are both regressions — in opposite directions.

**The failure this exists to catch:** the pre-change skill mentioned performance in three places and enforced it in none — ponytail's "simplest thing that works" could ship an N+1 loop that works on the dev fixture, and no trigger surfaced it. The scan is what makes "let me know when it hurts performance" a rule rather than a hope.

## 13. Investigation routing — the cheapest path, shown as a count

Three prompts, one setup: a scratch repo with the graphify skill installed. Cases A and B also need a built graph (`graphify-out/` present); case C must **not** have one.

**Prompt A (graph present):** paste a lite story, e.g. "change the checkout button label from 'Buy now' to 'Place order'."

**Expect:**
- Collapsed Step 1+2 gate opens with `[investigation: native search ×N · graph ×0]`, N ≤ 4.
- Every lookup is a native search (grep / the platform's index) for the label text, then the one file it points at. No `graphify` call of any kind, no `GRAPH_REPORT.md` opened. A lite gate showing `graph ×1` has regressed.

**Prompt B (graph present):** paste a small-feature story with real blast radius, e.g. "add a `cancelled_at` timestamp to orders and surface it on the admin order list."

**Expect:**
- Step 1 gate: marker shows `graph ×0` — who/what/why, scope, acceptance criteria and data model are all "where is X" lookups. Only the dependencies row may earn a graph query, and then it shows in the marker.
- Step 2 gate: marker shows `graph query ×1` or `×2` at most, each `--budget 1500`, spent on the Flow (what imports/calls the order model). Native lookups at this gate ≤ 3.
- **Never** a graph query followed by a grep for the same term followed by opening the same files — the dual-retrieval stack is the regression this scenario exists to catch.

**Prompt C (skill installed, no `graphify-out/`):** same story as B.

**Expect:**
- No `graphify .` / `graphify update` run at any point — the graph is not built mid-story.
- Both markers show `graph ×0`; Flow is derived from native search plus following imports by hand.
- Same caps apply. A run that builds the graph "so it can query it" has regressed.

**Contrast check across platforms:** run B on a platform with a semantic index (Cursor, Windsurf, Copilot) and one without (Cline, Codex, Gemini CLI). The counts should be the same shape; only the tool behind "native search" differs. A platform whose run bypasses its own index for graphify on a "where is X" question has regressed.

**The failure this exists to catch:** the pre-change rule said "graphify first, it's cheaper than grep" — true of the build, false of a query (vocabulary load + subgraph dump + the file reads that follow anyway). Nothing made the extra cost visible, so it landed silently on every story, lite ones most of all. The marker is the only cross-platform evidence that the cheaper path was actually taken.

## 14. Step 1 register — layman summary, technical plan

**Prompt:** paste a story in product language that maps onto real code, e.g. "when a parking slot is released early, the next person on the waitlist should be offered it." The repo has a `WaitlistService`, a `slot_releases` table and a `notify-waitlist` job.

**Expect (Step 1):**
- The Understanding Summary reads like the PO wrote it: who is on the waitlist, what they receive, what the releasing user sees, what happens if nobody accepts. Codebase findings shape the content ("today a released slot just goes back to the open pool — nobody on the waitlist is told") but no symbol, file path, table or job name appears unless the story used it.
- Clarifying questions are in the same register — "how long does the first person have to accept before it passes to the next?", not "what's the TTL on the reservation hold?".
- The `Scale target:` line stays, phrased plainly ("a few dozen waitlisted users per lot").

**Expect (Step 2):** the plan names `WaitlistService`, the `slot_releases` schema change and the job, with LLD depth per type. Layman wording persisting into the plan, or symbol names leaking into the Step 1 summary, is a failure.

## 15. Investigation honesty — no agent for scoped lookups, every read counted

**Prompt:** paste a story whose entities are all nameable from the ticket ("store selector", "membership", "session", "sidebar") in a repo with an obvious grep trail.

**Expect (Step 1):**
- No `Agent` call. Every "where is X / what shape is Y" goes through native search; the files it points at are opened directly.
- The marker counts every `grep`/`sed`/`cat`/Read that opened repo content. Six calls → `×6`, over cap → the gate says so and asks instead of reading on.
- Two coupled unknowns (e.g. how the active store reaches the server, and whether it survives reload) arrive as one numbered message with options, a recommendation and a one-token accept — not two paragraphs, not two turns.

**Expect (Step 3):**
- A dev server start is preceded by a port check; a second `EADDRINUSE` is a failure.
- A CLI usage error is followed by exactly one `--help | grep` and the fixed call; three retried flag guesses, or the full help text in context, is a failure.
- A UI task's verification names the browser/preview tool used, or states which tools were checked before falling back to rendered-HTML inspection.

**Counter-prompt:** a story whose concept has no known name ("do we already have anything like tenant scoping anywhere?") → one read-only Explore agent is acceptable, reported as `agent ×1`, its findings re-checked with native search before they appear in the Understanding Summary.

## Cross-cutting checks (verify on any scenario)

- Every Step 1, Step 2 and lite-collapsed gate opens with an `[investigation: …]` marker; lite gates show `graph ×0`; no gate exceeds the caps in "Investigation scope".

- Chat responses stay terse/bullet-fragment, not multi-paragraph.
- No gate skipped, even when lite-collapsed — confirmation still required before moving on.
- `node ~/.claude/skills/breadcrumbs/scripts/validate-context-file.mjs .breadcrumbs/context/<slug>.md` passes after every gate write.
- No task checked off without a stated verification outcome, in chat and (file exists) as a `Verified:` line.
- Step 3's gate never passes with a known-failing case — fixed and re-run, or escalated as a Mid-flight break.
- Step 4's **Test** section reports what *ran*, never what was planned.
- Step 3 emits no chat between the first edit and the point-8 review except a point-7 break; verification verdicts are in the Task Log/held note only.
- No subagent for a question native search can phrase; a permitted Explore agent is ≤1 per story, shown in the marker, its output verified before use. Marker counts every content-opening call.
- Step 1's Understanding Summary and questions are in plain product language — no symbols/paths/table names unless the story used them; Step 2 goes technical.
- Every Understanding Summary ends with a `Scale target:` line; a perf/scale regression found at Step 3.4 is told to the user before it is fixed or shipped, never absorbed silently.
- Every commit header passes `node ~/.claude/skills/breadcrumbs/scripts/validate-commit-message.mjs -m "<header>"`.
