# Step 3 — Implement

0. **Checkpoint — before task 1.** Full mode and the confirmed list has ≥4 tasks → no file yet: read `context-file-mechanics.md` + `context-template.md`, create the file, backfill Original Story / Understanding / Assumptions / Plan / Flow / Task Checklist, trip marker, then stop with one line: `Plan saved to .breadcrumbs/context/<slug>.md — run /compact now; I'll resume from the file.` After compact (or resume): the file is the whole state, don't re-read the transcript. <4 tasks or lite → skip.
1. One task at a time. **No text-only turns.** Between the first edit and the gate, every assistant message contains a tool call; the only text allowed is one line riding on the next call, shape `✓ Task N — <verdict, ≤8 words>`, and only after the task's verification passed. No "starting N", no "now task N+1", no "server started", no "good —". A message with text and no tool call is a point-7 break, nothing else. Nothing committed (6). Re-read this point before the first edit, not at the gate.
2. **Don't ask mid-task.** Judgment call → Task Log "Why". Contradicts the plan or needs a scope decision → Scope Changes, flag immediately.
3. `ponytail`: simplest thing that works, existing deps first, no unrequested abstractions. Never simplify away validation, error handling, security, accessibility, or the scale target — "works" means at that scale.
4. **Verify before checkoff.** Done = something demonstrates it works. **Every verdict below goes to the Task Log or held note, never chat.**
   - Run the 2.4 cases mapped to this task (lite → the named check). None mapped → repo fast checks over what you touched, name which. **Per task: the touched spec only.** Full suite once, at 8.
   - Nothing executable → say so + what was inspected. Silence isn't a verdict.
   - Fails → fix, re-run. Cause is the plan → 7.
   - **Self-review:** diff vs the task's Why — scaffolding, TODO-as-fix, workaround where root cause was the point, unasked abstraction. Fix now.
   - **Scale scan:** query/call per item of a growing collection, unbounded load, new query without pagination/index, sync work on a hot path. Trivial → fix, note in `Verified:`. Not trivial or target can't hold → not a checkoff, 7.
   - **Full-suite rule:** per task the touched spec only; gate 8 runs *both* the backend suite and the frontend suite, named, even when only one side changed.
   - **UI change → look at it.** Check the tool list (Claude Browser, `run` skill, simulator) before claiming none; SSR grep is the fallback, said as such.
   - **Dev servers:** `lsof -i :<port>` before the first start; taken → **never kill it** (it's the user's), start on a free port with the client env in the same command. Log filtered to `grep -Ei "started|local:|ready|EADDRINUSE|error"` (Nuxt/Vite print `Local:`, not "started").
   - **Manual E2E → one script per story**, in the repo's own package dir (so imports resolve), each scenario a function, run once, prints only asserted fields, cleans up, deleted after. Adding a scenario = editing that file, not writing a second one. Never one `curl` per turn.
   - **CLI usage error** → `<cmd> --help | grep <flag>` once, then the fixed call. No second guess, no full help text.
   - Outcome → `Verified:` (what ran, what it showed). Step 4's Test section comes only from this.
5. **Manual-edit review** — before each task and on resume: `git status` / `git diff HEAD` over the story's files. A change you didn't make → one-line `Check:` (correct, or issue: what/where). File off the Flow (2.6) → say so, non-blocking. Review, not veto: the edit stands unless it breaks something.

   After each task: file exists → append Task Log entry with `Verified:`, tick the box, one write, trip marker. Forms (`context-template.md`): judgment call → What/Why block; mechanical → one line; hand-edit → line + `Check:` (+ `Flow:` if off-plan). No file → hold the same as a private note for 8. Nothing sent to the user now.

   **Learning from the edit:** hand-edit or spoken correction that reads repo-wide (always strips X, always adds guard Y, "we never do X here") → ask once: "Save that as a standing project rule?" Yes → append to `.breadcrumbs/constitution.md`, apply from the next task. No → don't ask again for that pattern.
6. **Don't commit per task.** No `git add`/`commit` until 8's review is approved. No curiosity checks either (`git branch`, `git log`) — only calls that gate the next action.

   After approval: one commit per task, in order, mirroring the Task Log. Conventional Commits `<type>(<scope>): <imperative summary>`; body = short bullets from What/Why. Types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `chore` `revert`. Reverting a landed task (Scope Change after approval) → `git revert <hash>`, header rewritten to `revert(<scope>): <what was undone>`, hash + reason in body. Scope change mid-task → still one commit; type = what shipped. Check headers with `validate-commit-message.mjs` (resolution in `context-file-mechanics.md`); not found → by hand.
7. Test fails / assumption invalidated / scope changes / **scale regression** → Mid-flight break (`SKILL.md`). Then: Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update Assumptions/Plan/Checklist. Scale case: tell the user immediately — what regressed, against which target, what it takes to hold — before fixing. Absorb or fix is the user's call.
8. **Gate:** all tasks ticked → **run the whole planned test set** (every 2.4 case + backend suite + frontend suite, each named with its count) against the uncommitted tree. Any text-only turn since the first edit → one line at the top of the review admits it.
   - Red → fix, re-run; cause is the plan → 7. Never present with a known-failing case.
   - Nothing runnable → say so with what was checked, continue.
   - Green → **one review message, nothing committed:** per task — name, files (`git diff --stat`), and **what to check** (the risky assumption or exact behavior, or "mechanical, low risk").
     - Approved → commit every task in order (6), then summarize what was built and what proved it (cases + outcome, scale target measured or scanned). Stop for PR confirmation (`step4-pr.md`).
     - Issue flagged → fix in place (uncommitted), re-present only the affected task(s).

   Step 4 drafts from these commits; a fix after commits land is its own commit and Log entry (6's revert path).
