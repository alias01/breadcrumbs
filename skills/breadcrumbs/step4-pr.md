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
8. **[Testing] Session token stats.** Run `session-token-stats.mjs --by-tool` (resolve per "Validator scripts" in `context-file-mechanics.md` — don't assume `scripts/` is relative to the target repo's cwd) and show its full output under the draft verbatim, including the closing caveat line — don't trim it to just the total or the table, the cumulative-vs-context-window distinction it states is the part people misread. The point of this step is spotting which category (system prompt, Read, Bash, Edit, chat replies, ...) is driving cost. Not found → skip, don't block. Drop this step once it's no longer needed for testing.
9. Confirmed + file exists → write one line to PR Summary: `Last drafted: <date>` (anchor for diffing Scope Changes later, not a text copy). Update Status to `pr-ready`, same pass. Trip marker. No file → nothing to write.
