# Step 1 — Understand & Clarify

1. Read the story. **State back your understanding first**, own words, before asking anything. Repo look-ups stay scoped to the story's own terms ("Investigation scope" in `SKILL.md`).

   **Layman register — this step only.** Understanding Summary and every question read the way the story's owner would say it: who does what, what they see, what changes, what stays. Look-ups feed the *content* (what exists, what this touches, where story and code disagree); the *wording* stays plain — "the screen where a driver picks a slot", not `SlotPickerView`. Symbols, paths, tables, endpoints only if the story uses them or the user asks. The taxonomy below is your scan list, not the summary's vocabulary. Test: the story's author could confirm it line by line.
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

   Skip categories that obviously don't apply. Ask each genuinely vague item as its own question, one at a time, wait for the answer. Two *independent* unknowns never share a message, even when they look like the same topic. **Coupled sub-questions** — where one answer constrains the other (transport of the active store *and* whether it survives reload; which screen *and* what it's called) — go in one message, formatted so each part is answerable on its own:

   ```
   Two linked decisions:
   1. <part one, plain language> — options: (a) … (b) …
   2. <part two> — depends on 1: if (a) then …
   My pick: 1a, 2 yes — because <one line>. Reply "ok", or "1b" / "2 no" to change either.
   ```

   Numbered, options per part, a recommendation, a one-token accept. Never a prose paragraph holding two questions.

   **Plain chat text by default, not a question widget.** A binary or short-answer clarification ("is placement X fine, or do you want it moved to Y?") goes in the message itself. Reach for a structured question tool only when there are genuinely 3+ distinct options worth laying out side by side, or the answer benefits from being picked rather than typed — not for every clarification reflexively.

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
