# Step 4 — PR

1. Tell the user the work is ready for a PR.
2. Title: file exists → derive from it (`<Ticket ID/slug>: <imperative summary>`, file header + Understanding Summary). No file → compose the same way from the conversation.
3. Fixed section set, same five names regardless of type — **What, Why, Test, Rollback, Dependencies.** No type-varying sections anymore. Bias toward fewer: include a section only if it earns its place for a reviewer, omit rather than pad. File exists → pull content from it, don't re-summarize; no file → derive the same from the conversation.
   - **What** — always. The change, as plainly as possible. ← Task Log "What" entries, concatenated.
   - **Why** — always, unless it'd just restate What (trivial copy/config fix) — then drop it. ← Task Log "Why" entries, only where they add something What didn't.
   - **Test** — what actually verified it, *with the outcome*: the cases run at Step 3.4/3.8 and what they showed, manual repro steps, or "nothing runnable" + what was inspected instead. Skip only when genuinely nothing to verify. ← Task Log `Verified:` lines and the Step 3 gate's full run — **not** the Plan's testing notes, which say what was intended; a reviewer reading "unit tests for the retry path" needs to know they ran, not that they were planned. Verification reported none → say that, don't invent.
   - **Rollback** — only if reverting isn't a plain revert (migration, feature flag, external state, data backfill). ← Plan/Scope Changes, only where flagged.
   - **Dependencies** — only if this PR depends on or blocks something else, including sitting on top of another unmerged branch. ← Assumptions/Plan, only where flagged; branch dependency ← `git merge-base HEAD <default-branch>` isn't `<default-branch>`'s tip → this branch is stacked, name the base branch, note it needs merging first.
   - **What changed since last PR** (later-update case only) ← Scope Changes dated after the last PR Summary write.
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

   **Test:** Regression test simulates a retried request, asserts a single charge — passes; provider-retry suite green.
   ```
5. **Show the draft directly in chat, stop there.** Not a file draft awaiting a later write — the deliverable itself. No way to open a PR on GitHub/GitLab/Bitbucket → the chat message *is* the artifact, user copies it into the platform's PR field. Nothing written to the context file here — no later gate reads a stored PR summary back.
6. **Gate:** confirm or request changes, iterate in chat, until happy with what they'll paste.
7. Confirmed + file exists → write one line to PR Summary: `Last drafted: <date>` (anchor for diffing Scope Changes later, not a text copy). Update Status to `pr-ready`, same pass. Trip marker. No file → nothing to write, chat draft was the whole deliverable.
