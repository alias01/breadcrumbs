# Step 4 — PR

1. Tell the user the work is ready for a PR.
2. Title: file exists → derive from it (`<Ticket ID/slug>: <imperative summary>`, file header + Understanding Summary). No file → compose the same way from the conversation.
3. Fixed section set, same five names regardless of type — **What, Why, Test, Rollback, Dependencies.** No type-varying sections anymore. Bias toward fewer: include a section only if it earns its place for a reviewer, omit rather than pad. File exists → pull content from it, don't re-summarize; no file → derive the same from the conversation.
   - **What** — always. The change, as plainly as possible. ← Task Log "What" entries, concatenated.
   - **Why** — always, unless it'd just restate What (trivial copy/config fix) — then drop it. ← Task Log "Why" entries, only where they add something What didn't.
   - **Test** — how it's verified: what was added, **plus the Step 3.6 verification result** (command run, green). Skip only when genuinely nothing to verify. ← `Verification` section / test-related Task Log entries / Plan testing notes; no coverage found → say so, don't invent. Never write this section as though a suite ran when point 3.6 found nothing runnable — say that instead.
   - **Rollback** — only if reverting isn't a plain revert (migration, feature flag, external state, data backfill). ← Plan/Scope Changes, only where flagged.
   - **Dependencies** — only if this PR depends on or blocks something else, including sitting on top of another unmerged branch. ← Assumptions/Plan, only where flagged; branch dependency ← `git merge-base HEAD <default-branch>` isn't `<default-branch>`'s tip → this branch is stacked, name the base branch, note it needs merging first.
   - **What changed since last PR** (later-update case only, incl. every re-entry round per point 8) ← Task Log entries **and** Scope Changes dated after `Last drafted:`. Task Log alone isn't enough — most review work is a fix, not a requirement change, so it never reaches Scope Changes. Declined asks (point 8) belong here too, one fragment: what was asked, why it wasn't done.
4. **Cap every included section at 2 lines.** Pulled content runs long — compress to the essential point(s), don't truncate mid-sentence. Can't fit without losing something needed → signal the task/decision was too broad, not a reason to break the cap. **Whole draft should read in 2-5 min.** Runs longer with every section already trimmed and only the earned ones kept → the story was too big for one PR, say so instead of shipping a wall of text.

   Template:
   ```markdown
   ## <Ticket ID/slug>: <imperative summary>

   **What:** <line 1>
   <line 2, only if needed>

   **Why:** <line 1>
   <line 2, only if needed>

   **Test:** <line 1>

   **Rollback:** <only if non-trivial>

   **Dependencies:** <only if any>
   ```
   Example (bug fix — Rollback and Dependencies both omitted, plain revert, none):
   ```markdown
   ## PARK-482: Fix duplicate charge on payment retry

   **What:** Payment retries were generating a new charge instead of reusing the original attempt.

   **Why:** Retries omitted an idempotency key, so the provider treated each retry as a new charge. Now one key is generated per order and forwarded on every retry.

   **Test:** Regression test simulates a retried request and asserts a single charge. `npm test` green.
   ```
5. **Show the draft directly in chat, stop there.** Not a file draft awaiting a later write — the deliverable itself. No way to open a PR on GitHub/GitLab/Bitbucket → the chat message *is* the artifact, user copies it into the platform's PR field. Nothing written to the context file here — no later gate reads a stored PR summary back.
6. **Gate:** confirm or request changes, iterate in chat, until happy with what they'll paste.
7. Confirmed + file exists → write one line to PR Summary: `Last drafted: <date>` (anchor for diffing Task Log/Scope Changes later, not a text copy). Update Status to `pr-ready`, same pass. Trip marker. No file → nothing to write, chat draft was the whole deliverable.
8. **Re-entry — review comes back.** Reviewer requests changes, or CI fails on the opened PR. Not a new story and not a Step 5: re-enter **Step 3** with the requested work appended to the existing Task Checklist, and come back through this step. Steps 1 and 2 don't re-run — the story's understanding and plan already stand.

   - **File first.** This is a file-creation trigger in its own right (`SKILL.md`) — review lands hours or days later, usually in a different session. No file yet (single-sitting story) → create it now and backfill from the PR description and diff, saying in one line that the pre-review trail was reconstructed rather than recorded. Every later round then has a real trail.
   - **Triage each thread before it becomes a task.** Not every comment is work:
     - Small and in scope (nit, rename, missing test, one-function refactor) → new task, appended with the next number, never renumbered over the old ones.
     - Changes a requirement (reviewer wants behavior the Understanding Summary doesn't cover) → Scope Change entry first, per point 7 of `step3-implement.md`, *then* the task. This is the one path that escalates lite → full.
     - Disagree, or out of scope → **don't build it.** Reply on the thread with the reasoning; record it as a declined ask (below). Silently implementing something you think is wrong loses the disagreement from the record.
   - `Status` back to `implementing` (amended in place). Then Step 3 as normal: one task at a time, Task Log, one commit each.
   - **Step 3.6 re-runs** after the round's last task — every round is verified, not just the first. `Verification` block amended in place.
   - Record the round under `## Review Rounds` (`context-template.md`): what was asked, which tasks it became, what was declined and why. Cheapest thing to write now, most expensive to re-derive from a thread that later gets resolved and collapsed.
   - Back here, redraft with **What changed since last PR** included (point 3). New `Last drafted:` line replaces the old one; `Status` returns to `pr-ready`.
   - **Re-entry alone doesn't escalate lite → full** — a nit on a copy change doesn't earn an HLD. Only the Scope Change path above does.
   - Rounds repeat as needed. Nothing caps them, but a story on its fourth round is the same signal as blowing the task cap: raise it, propose splitting what's left into a follow-up PR.
