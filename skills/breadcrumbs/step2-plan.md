# Step 2 — Plan

*Lite mode skips this step.* Full-mode + zero Material unknowns (Step 1) → also skips the separate gate, folded into 1.6 instead. Decided purely by the Material count from 1.5 — never type, never task/file count. Large multi-file story, nothing genuinely unknown → merges just as readily as a small one.

Order matters here: everything that can *add* work (points 3-5) runs before the task breakdown (point 6), so tasks are cut once and the cap in point 7 is applied to the real list.

1. Classify from the confirmed Understanding Summary (already done, 1.4, for lite-eligible types; do it here otherwise). Ask the user only if genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | reported defect, "should do Y but does Z" | No HLD/LLD — root cause + fix approach |
   | Copy/config/content change | text, labels, flags, env values, constants | No design — straight to task list |
   | Small feature addition | new behavior in existing architecture, no new component | LLD only, skip HLD |
   | Refactor/tech debt | no behavior change, restructuring | LLD only, scoped to what's restructured |
   | New feature/subsystem | new capability spanning components | Full HLD + LLD |
   | New service/integration | new external dependency, new cross-system data flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resource usage, scaling | No design doc — profiling findings + targeted fix |

   Size doesn't classify — the Flow does. Type is about *what kind of change*; the file/task ceilings in point 7 catch a story that outgrew its type.

2. Discuss the approach at the depth classification calls for: HLD → system-design level (components, data flow, integration points). LLD → key functions/classes/schema. "No design" → name the fix approach, one-two sentences. Not a formal doc — enough to agree the shape before code. Same scoped-search rule as Step 1 ("Investigation scope" in `SKILL.md`) — chase the components the story actually touches, not the whole repo.
   - **Tripwire:** plan surfaces a Material unknown Step 1 missed → stop, resolve there (ask / log `unconfirmed` per 1.3 in `step1-understand.md`), before continuing. Applies even when 1+2 merged — a bad merge decision surfaces here, doesn't get built around.
   - **Architecture decisions:** 2+ valid approaches exist → pick one, state why, write it down (Plan section of the context file, or the chat message if no file yet) — not left as an unstated call in your head. Cross-team surface (FE/BE split) → agree the contract (API shape, request/response, error codes) before either side's tasks start.
   - **Risks/unknowns:** distinct from Step 1's Material/Cosmetic tags (those are about the story's *requirements*; this is about *implementation* risk) — flag parts you're unsure how to implement, parts touching unfamiliar code, anything needing a spike/research before real work starts, anything that could break existing functionality. Genuinely open → same tripwire handling as a Material unknown (ask, or log `unconfirmed` and proceed). Recorded, not just said — see point 9.

**Depth gate for points 3-5** — single source of truth for how much of the next three points runs. Points 3-5 don't restate it.

| Design depth | Points 3-5 |
|---|---|
| No design (copy/config, performance, bug fix reaching here via escalation) | Skip 3 and 4 — the one regression case that proves the fix is enough. Point 5 only if the story itself touches prod data/payments/migration. |
| LLD only (small feature, refactor) | Point 3: the single domain the story touches, folded into point 2's discussion — no table walk. Point 4: one line. Point 5: only if schema/prod-data/payments involved. |
| Full HLD + LLD (new feature/subsystem, new service/integration) | All three explicitly, as written below. |

Story sits at a lighter depth but genuinely carries the risk (a "small feature" writing a migration) → the risk decides, not the label. That's a judgment call, not a reason to run the whole table.

3. **Domain-specific checks** — orthogonal to the Type table in point 1 (Type drives design depth/task caps; a story can span 0, 1, or multiple domains below). Identify which domain(s) the story touches; anything they surface goes into the approach (point 2) and, if it's work, into the task breakdown (point 6). Skip domains the story doesn't touch.

   **No re-asking.** Auth/permissions, error handling, backward compatibility and performance/scale were already scanned in Step 1's taxonomy. Here they're checked against the *plan*, silently — a question only goes back to the user if the plan surfaces something Step 1's answer doesn't cover, and then it's a point-2 tripwire, not a fresh round of questions.

   | Domain | Checks |
   |---|---|
   | API/backend | Request/response contract defined (fields, types, status codes) — feeds point 2's cross-team contract; auth/permission requirements clear; rate limiting/throttling considered; idempotency needed (safe to retry without side effects); versioning impact on existing consumers; expected load/concurrency where it changes the design |
   | Mobile app | Offline behavior defined; platform differences (iOS vs Android behavior/UI); app store review implications if UI/permissions change; battery/data usage impact if polling or background work involved |
   | Database/schema | Migration is backward-compatible during deploy, reversible or rollback plan exists — feeds point 5; impact on existing queries/indexes considered; backfill needed for existing records; data volume at expected scale |
   | Bug fix (only reachable via a lite→full escalation — plain bug fixes are lite and skip Step 2 entirely) | Root cause understood, not just the symptom; repro steps confirmed; checked whether the same defect exists elsewhere before patching one spot; regression test added — feeds point 4 |
   | Infra/DevOps | Uptime/downtime impact known; monitoring/alerting updated if new failure modes introduced; cost impact considered (new resources, scaling); change is scriptable/repeatable, not a manual one-off |
   | Data pipeline/ETL | Source data reliability/format assumptions validated; failure handling defined for a batch failing midway; reprocessing/backfill strategy exists; downstream consumers identified |
   | Third-party integration | Rate limits and pricing of the third-party API known; failure/downtime handling for when the third party is unavailable; auth/credential management approach clear; webhook vs polling decision made |
   | UI-only/design (no backend change) | Responsive behavior across breakpoints confirmed; accessibility (contrast, keyboard nav, screen reader) considered; design system components reused, not one-offs |

4. **Testing plan:** identify which logic needs unit test coverage, list the manual/integration test cases (including the edge cases already surfaced in Step 1's error-handling taxonomy item and any domain-specific regression case from point 3), and confirm there's a clear way to verify the result against Step 1's acceptance criteria. Test work that's substantial enough to stand alone becomes its own task in point 6.

5. **Rollout & rollback** — only for stories that touch production data, payments, or require a migration/backward-compat path (New service/integration is where this is most often mandatory; the Database/schema domain always needs it; other types only if the story itself says so): decide whether a feature flag is needed, address migration/backward-compatibility concerns, and confirm a rollback plan exists. Flag/migration/backfill work is real work — it becomes tasks in point 6, not a footnote.

6. Agreed → break into small tasks along natural seams: dependency order first, then component/layer (multi-part work) / file-module boundary (refactors). For multi-layer stories, make the layers explicit — frontend (components, state, routing), backend (endpoints, business logic), data layer (schema changes, migrations), integration points (third-party APIs, other services) — only the layers the story actually touches. Scoped right = one Task Log entry (one What + one Why, no "and also"), ≤3 files. Otherwise: split further. Everything points 3-5 surfaced is already on the table by now — nothing gets appended after the cap check below.
   - **Flow:** the ordered file/module list across all tasks = the story's **Flow** — the set of files this story is expected to touch, and in what order. Derived directly from the task breakdown, no extra thinking. Decided here, at planning, not revisited unless a Scope Change amends it.
   - **Sequencing:** note which tasks have no shared dependency (safe to reorder or hand off separately) and the smallest slice of the task list that would be independently shippable/demoable, if one exists — informs how Step 3 can be checkpointed. Recorded, not just said — see point 9.

7. Cap total tasks by type — ceiling, not target, applied to the finished list from point 6:

   | Type | Max tasks | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — likely misclassified |
   | Small feature | 5 | reconsider — may be "new feature/subsystem" |
   | Refactor | 8 | acceptable upper bound |
   | New feature/subsystem | 10 | **stop, flag** — propose splitting before Step 3 |
   | New service/integration | 10 | same — flag before implementing |
   | Performance | 5 | more usually means multiple bottlenecks — separate stories |

   **Flow size check:** per-task file cap (point 6) × task cap above compounds to 30 files worst case, uncapped independently of the task-count flag. Flow nearing ~30 distinct files → flag, propose splitting, before Step 3 — same treatment as hitting the task ceiling. A "Small feature" whose Flow runs past ~8 files is the early signal of the same problem: raise it as a possible misclassification.

8. **Constitution check:** `.breadcrumbs/constitution.md` exists (see "Project constitution" in `context-file-mechanics.md`) → read it once here and check the *whole* plan against it — approach, domain checks, testing, rollout, tasks — before presenting. Runs last on purpose: the rules it holds ("retries carry an idempotency key," "migrations must be reversible") match content that doesn't exist until points 3-5. Conflict → same handling as the point-2 tripwire, resolve before continuing. No file → nothing to check, skip silently.

9. File exists → one pass, writing: story type, design depth, HLD/LLD notes, architecture decisions, **Risks/Unknowns** (point 2), domain-check outcomes, testing plan, rollout/rollback notes, Flow, **Sequencing** (point 6), Task Checklist — each only where it applied. Risks and Sequencing are the two most expensive things to re-derive on resume; they don't get left in chat. No file → stays in chat.
10. **Gate:** trip marker if a write happened. Present plan + task breakdown, quoted verbatim. Stop, wait for confirmation before implementing (`step3-implement.md`).
