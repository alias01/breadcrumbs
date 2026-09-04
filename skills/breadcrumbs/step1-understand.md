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
6. **Gate:** investigation marker first (see "Investigation scope" in `SKILL.md`), then: file exists → write Understanding Summary + Assumptions to it in one pass, trip marker. No file → present the same content in chat only. Understanding Summary always ends with one `Scale target:` line (point 2) — the assumed "current scale" form included, so a resuming session and the PR reviewer both know what the story was sized for.
   - **Zero Material unknowns** → fold Step 2 in: do Step 2's work silently (read `step2-plan.md`), present Understanding Summary + Plan together, one combined confirmation, both quoted verbatim. Regardless of story type/task count.
   - **Any Material unknown remains** (even `unconfirmed`) → summary alone, quoted verbatim, stop. No Step 2 until confirmed.
