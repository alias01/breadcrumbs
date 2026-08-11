# Step 4 — PR

1. Tell the user the work is ready for a PR.
2. Title: file exists → derive from it (`<Ticket ID/slug>: <imperative summary>`, file header + Understanding Summary). No file → compose the same way from the conversation.
3. Fixed section set, same five names regardless of type — **What, Why, Test, Rollback, Dependencies.** No type-varying sections anymore. Bias toward fewer: include a section only if it earns its place for a reviewer, omit rather than pad.
   - **What** — always. The change, as plainly as possible.
   - **Why** — always, unless it'd just restate What (trivial copy/config fix) — then drop it, don't pad.
   - **Test** — how it's verified: test added, manual repro steps, "none needed" + reason. Skip only when there's genuinely nothing to verify (pure copy/comment change).
   - **Rollback** — only if reverting isn't a plain revert (migration, feature flag, external state, data backfill). Omit otherwise — don't state the obvious.
   - **Dependencies** — only if this PR depends on or blocks something else (another PR, a migration, a config flag, an external service). Omit otherwise.

4. File exists → pull from it, don't re-summarize. No file → derive the same from the conversation:
   - What ← Task Log "What" entries, concatenated
   - Why ← Task Log "Why" entries, only where they add something What didn't already say
   - Test ← test-related Task Log entries / Plan testing notes; no coverage found → say so plainly, don't invent
   - Rollback ← Plan/Scope Changes, only where a non-trivial revert path was flagged
   - Dependencies ← Assumptions/Plan, only where an external or ordering dependency was flagged
   - What changed since last PR ← Scope Changes dated after the last PR Summary write (later-update case only)
5. **Cap every included section at 2 lines.** Pulled content runs long — compress to the essential point(s), don't truncate mid-sentence. Can't fit without losing something needed → signal the task/decision was too broad, not a reason to break the cap. **Whole draft should read in 2-5 min.** Runs longer with every section already trimmed and only the earned ones kept → the story was too big for one PR, say so instead of shipping a wall of text.

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

   **Test:** Regression test simulates a retried request and asserts a single charge.
   ```
6. **Show the draft directly in chat, stop there.** Not a file draft awaiting a later write — the deliverable itself. No way to open a PR on GitHub/GitLab/Bitbucket → the chat message *is* the artifact, user copies it into the platform's PR field. Nothing written to the context file here — no later gate reads a stored PR summary back.
7. **Gate:** confirm or request changes, iterate in chat, until happy with what they'll paste.
8. Confirmed + file exists → write one line to PR Summary: `Last drafted: <date>` (anchor for diffing Scope Changes later, not a text copy). Update Status to `pr-ready`, same pass. Trip marker. No file → nothing to write, chat draft was the whole deliverable.
