# Step 1 — Understand & Clarify

1. Read the story. **State back your understanding first**, own words, before asking anything. Look-ups stay scoped to the story's terms (`SKILL.md` Investigation scope).

   **Layman register — this step only.** Summary and questions read as the story's owner would say them: who does what, what they see, what changes, what stays. Look-ups feed the content (what exists, what this touches, where story and code disagree); wording stays plain — "the screen where a driver picks a slot", not `SlotPickerView`. Symbols, paths, tables, endpoints only if the story uses them or the user asks. The taxonomy below is your scan list, not the summary's vocabulary. Test: the story's author could confirm it line by line.
2. Then follow-ups, only on what's genuinely vague. Scan this taxonomy; skip what doesn't apply:
   - Who/what/why: specific persona, goal, why it matters
   - Scope: in, out, one story or several
   - Acceptance criteria: testable "done", happy path, demo scenario
   - Dependencies & context: other stories/APIs/systems, mockups, what this blocks
   - Data model/schema, source of truth, existing data
   - API/contract boundaries
   - Auth/permissions
   - Error handling & edge cases: error/loading/empty states, empty input, network failure, denied
   - **Scale target:** volume, rate, latency budget. Stated → record verbatim. Silent → Material only if the change sits on a data- or request-dependent path; else Cosmetic → "none stated — current scale assumed", logged per 3. Not knowing is the failure. Step 2 sizes against it, Step 3.4 judges the diff by it.
   - Security/compliance, device/platform
   - i18n/locale
   - Backward compatibility
   - Existing pattern or net-new

   **One question per message**, wait for the answer. Independent unknowns never share a message. **Coupled** sub-questions (one answer constrains the other) go together, each part answerable alone:

   ```
   Two linked decisions:
   1. <part one> — options: (a) … (b) …
   2. <part two> — depends on 1: if (a) then …
   My pick: 1a, 2 yes — because <one line>. Reply "ok", or "1b" / "2 no".
   ```

   Plain chat text, not a question widget — a widget only for 3+ distinct options worth comparing side by side.

   **Ask order + stop rule:** classify first (point 5), Material before Cosmetic; Cosmetic → assume and log. Stop when the story is buildable and every gap is Cosmetic or safely assumable → rest to Assumptions as `unconfirmed`. Soft ceiling ~5 questions; hit it with Material open → stop anyway, log `unconfirmed`. Either stop → one line before the gate: `Stopping questions here — assuming <X>, <Y> (logged unconfirmed). Flag if wrong.`
3. User can't answer → don't block. Log under Assumptions with reasoning, `unconfirmed`, say it needs owner confirmation, proceed.
4. Classify: `Bug fix` / `Copy/config/content change` (**lite**) / `Small feature addition` / `Refactor/tech debt` / `New feature/subsystem` / `New service/integration` / `Performance/optimization` (**full**; depth in Step 2.1). State the mode, one line.
5. **Tag every open question/assumption:** Cosmetic (naming, location, formatting — wrong guess costs nothing) or Material (data model, contract, business logic, security, user-visible behavior — wrong guess = rework). Tag count, not type or size, decides the gate.
6. **Gate:** investigation marker; file exists → write Understanding Summary + Assumptions in one pass, trip marker; else same content in chat. Summary always ends with one `Scale target:` line.
   - **Zero Material unknowns** → fold Step 2 in: do its work silently (`step2-plan.md`), present Summary + Plan together, one confirmation.
   - **Any Material unknown** (even `unconfirmed`) → summary alone, stop. No Step 2 until confirmed.
