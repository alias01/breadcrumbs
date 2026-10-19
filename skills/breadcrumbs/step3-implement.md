# Step 3 — Implement

0. **Before task 1.**
   - **Branch:** `git branch --show-current`. Not `feature/<slug>` → `git checkout -b feature/<slug>` from the default branch (from the current one only if this story depends on it unmerged — say so; Step 4 Dependencies names the base). One line: `On feature/<slug> (from main)`. Never commit onto another story's branch.
   - **Checkpoint:** full mode, ≥4 tasks → read `context-file-mechanics.md` + `context-template.md`, create the file (Original Story, Understanding, Assumptions, Plan, Flow, Checklist), trip marker, stop: `Plan saved to .breadcrumbs/context/<slug>.md — run /compact now; I'll resume from the file.` Next message isn't a compaction → `Not compacted — continuing at ~<N>k context`, proceed, don't re-ask. After compact the file is the whole state; don't re-read the transcript. <4 tasks or lite → skip.
1. One task at a time. **No text-only turns** between the first edit and the gate: every message carries a tool call. Only allowed text: `✓ Task N — <verdict, ≤8 words>`, *in the same message* as the next task's first call — sent alone, it is the violation. No "starting N", "good —". Text with no tool call = a point-7 break, nothing else. Nothing committed (6). Re-read this point before the first edit.
2. **Don't ask mid-task.** Judgment call → Task Log "Why". Contradicts the plan / needs a scope decision → Scope Changes, flag now.
3. `ponytail`: simplest thing that works, existing deps first, no unrequested abstractions. Never simplify away validation, error handling, security, accessibility, or the scale target — "works" means at that scale.
4. **Test first, verify before checkoff.** Done = something demonstrates it. **Every verdict → Task Log or held note, never chat.**
   - **Red first — every task, lite included.** Before any implementation edit: write the 2.4 smoke test, run it, confirm it fails *for the expected reason* (missing route/element, wrong value — not syntax/import/setup). → `Red: <repo-relative test path> › <name> — <failure>` (the freeze hook reads the path). Bug fix: red on unfixed code. Refactor: characterization test *green* on current code, own first task (`Red: n/a — characterization`). Nothing executable (types-only contract, docs) → `Red: n/a — <why>`.
   - **Frozen after red:** its assertions and the contract fixture (2.6) are fixed for the story; changing them = 7 Scope Change, never silent. Setup plumbing may change. Opt-in hook: `hooks/freeze-tests.mjs`.
   - **Green:** implement until it passes — by exit code + stderr, never a printed summary.
   - Run the 2.4 cases mapped to this task (lite → the named check). None mapped → repo fast checks over what you touched, name which. **Per task: the touched spec only.** Full suite once, at 8.
   - Nothing executable → say so + what was inspected; silence isn't a verdict. Fails → fix, re-run; cause is the plan → 7.
   - **Self-review:** diff vs the task's Why — scaffolding, TODO-as-fix, workaround where root cause was the point, unasked abstraction. A smoke test that passes with the feature deleted doesn't count. Fix now.
   - **Scale scan:** query/call per item of a growing collection, unbounded load, new query without pagination/index, sync work on a hot path. Trivial → fix, note in `Verified:`. Not trivial or target can't hold → not a checkoff, 7.
   - **UI change → look at it** (Claude Browser, `run` skill, simulator — check the tool list before claiming none); SSR grep is the fallback, said as such.
   - **Dev servers:** `lsof -i :<port>` first; taken → **never kill it** (the user's), use a free port, client env in the same command. Log via `grep -Ei "started|local:|ready|EADDRINUSE|error"`.
   - **Manual E2E → one script per story**, in the repo's package dir (imports resolve), env loaded as the repo's config does (`import 'dotenv/config'` if `prisma.config.ts` does), one function per scenario, run once, prints only asserted fields, cleans up, deleted after. New scenario = edit that file. Never one `curl` per turn.
   - **CLI usage error** → `<cmd> --help | grep <flag>` once, then the fixed call. No guessing, no full help.
   - Outcome → `Verified:` (what ran, what it showed). Step 4's Test section comes only from this.
5. **Manual-edit review** — before each task and on resume: `git status` / `git diff HEAD` over the story's files. A change you didn't make → one-line `Check:` (correct, or issue: what/where). File off the Flow (2.6) → say so, non-blocking. Review, not veto: the edit stands unless it breaks something.

   After each task: file exists → append Task Log entry with `Red:` + `Verified:`, tick the box, one write, trip marker. Forms (`context-template.md`): judgment call → What/Why block; mechanical → one line; hand-edit → line + `Check:` (+ `Flow:` if off-plan). No file → hold the same as a private note for 8. Nothing sent to the user now.

   **Learning from the edit:** hand-edit or correction that reads repo-wide ("we never do X here") → ask once: "Save that as a standing project rule?" Yes → append to `.breadcrumbs/constitution.md`, apply from the next task. No → don't re-ask for that pattern.
6. **Don't commit per task.** No `git add`/`commit` until 8's review is approved. No curiosity checks either (`git branch`, `git log`) — only calls that gate the next action.

   After approval: one commit per task, in order, mirroring the Task Log — few Bash calls, no text between commits. Conventional Commits `<type>(<scope>): <imperative summary>`; body = short bullets from What/Why. Types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `chore` `revert`. Reverting a landed task → `git revert <hash>`, header `revert(<scope>): <what was undone>`, hash + reason in body. Scope change mid-task → still one commit; type = what shipped. Check headers with `validate-commit-message.mjs -m "<header>"` (resolution: `context-file-mechanics.md`; a bare argument is read as a file path); not found → by hand.
7. Test fails / assumption invalidated / scope changes / **scale regression** → Mid-flight break (`SKILL.md`). Then: Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update Assumptions/Plan/Checklist. Scale case: tell the user before fixing — what regressed, which target, what holding it takes. Absorb or fix is their call.
8. **Gate:** all tasks ticked → **run the whole planned test set** (every 2.4 case + backend suite + frontend suite — both, even if one side changed — each named with its count) against the uncommitted tree. Any text-only turn since the first edit → one line at the top of the review admits it.
   - Red → fix, re-run; cause is the plan → 7. Never present with a known-failing case.
   - Nothing runnable → say so with what was checked, continue.
   - Green → **one review message, nothing committed:** per task — name, files (`git diff --stat`), and **what to check** (the risky assumption or exact behavior, or "mechanical, low risk").
     - Approved → commit every task in order (6), then summarize what was built and what proved it (cases + outcome, scale target measured or scanned). Stop for PR confirmation (`step4-pr.md`).
     - Issue flagged → fix in place (uncommitted), re-present only the affected task(s).

   **Review round, not fix-per-message.** Question → answer inline, no edit. Change request → note it; another lands before it's applied → apply both together. A single unambiguous "fix this now" → immediately. Re-run only the specs the batch touched; full suites once more, right before approval. Re-present only what changed.

   **Review running long** (3+ fix rounds, or "pause"/"continue later") → checkpoint as 3.0: suggest `/compact`; no file → create it first, backfilled to the review state.

   Step 4 drafts from these commits; a fix after commits land is its own commit and Log entry (6's revert path).
