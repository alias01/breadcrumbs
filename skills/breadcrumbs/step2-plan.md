# Step 2 — Plan

*Lite mode skips this step.* Full mode + zero Material unknowns (Step 1) → no separate gate, folded into 1.6. Decided purely by the Material count from 1.5 — never type, never task/file count.

Order matters: everything that can *add* work (points 3-5) runs before the task breakdown (point 6), so tasks are cut once and point 7's cap applies to the real list.

1. Classify from the confirmed Understanding Summary (done at 1.4 for lite types; do it here otherwise). Ask only if genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | reported defect, "should do Y but does Z" | No HLD/LLD — root cause + fix approach |
   | Copy/config/content change | text, labels, flags, env values, constants | No design — straight to task list |
   | Small feature addition | new behavior in existing architecture, no new component | LLD only, skip HLD |
   | Refactor/tech debt | no behavior change, restructuring | LLD only, scoped to what's restructured |
   | New feature/subsystem | new capability spanning components | Full HLD + LLD |
   | New service/integration | new external dependency, new cross-system data flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resource usage, scaling | No design doc — profiling findings + targeted fix |

   Type is *what kind of change*; size doesn't classify. Point 7's ceilings catch a story that outgrew its type.

2. Discuss the approach at the depth classification calls for: HLD → components, data flow, integration points. LLD → key functions/classes/schema. "No design" → the fix approach, one-two sentences. Enough to agree the shape before code, not a formal doc. Same scoped-search rule as Step 1.
   - **Tripwire:** plan surfaces a Material unknown Step 1 missed → stop, resolve there (ask, or log `unconfirmed` per 1.3) before continuing. Applies even when 1+2 merged.
   - **Architecture decisions:** 2+ valid approaches → pick one, state why, write it down (Plan section of the file, or the chat message if no file). Cross-team surface (FE/BE split) → agree the contract (API shape, request/response, error codes) before either side's tasks start.
   - **Risks/unknowns:** *implementation* risk, distinct from Step 1's requirement tags — parts you're unsure how to implement, unfamiliar code, anything needing a spike, anything that could break existing functionality. Genuinely open → same tripwire handling. Recorded (point 9), not just said.

**Depth gate for points 3-5** — single source of truth; the points don't restate it.

| Design depth | Points 3-5 |
|---|---|
| No design (copy/config, performance, bug fix reaching here via escalation) | Skip 3 and 4 — the one regression case that proves the fix is enough. Point 5 only if the story touches prod data/payments/migration. |
| LLD only (small feature, refactor) | Point 3: the single domain the story touches, folded into point 2 — no table walk. Point 4: one line. Point 5: only if schema/prod-data/payments involved. |
| Full HLD + LLD (new feature/subsystem, new service/integration) | All three explicitly, as written below. |

Lighter depth but the story genuinely carries the risk (a "small feature" writing a migration) → the risk decides, not the label.

3. **Domain-specific checks** — orthogonal to Type (a story spans 0, 1, or several domains). Anything surfaced goes into the approach (point 2) and, if it's work, into the task breakdown (point 6). Skip domains the story doesn't touch.

   **No re-asking.** Auth, error handling, backward compatibility and the scale target were scanned in Step 1. Here they're checked against the *plan*, silently — a question goes back to the user only via the point-2 tripwire.

   **Scale target check** — every design depth in full mode, one fragment. Walk the plan's data- or request-dependent paths (new query, loop over user data, call on a hot path) against Step 1's `Scale target:`. Holds → say how ("paginated, indexed on `user_id`"). Doesn't, or can't tell → point-2 tripwire: change the approach, or log under Risks/Unknowns as open. "Current scale assumed" → the check is that nothing gets worse than today. Sizing, not optimizing.

   | Domain | Checks |
   |---|---|
   | API/backend | Request/response contract defined (fields, types, status codes) — feeds point 2's cross-team contract; auth/permission requirements clear; rate limiting/throttling; idempotency (safe to retry); versioning impact on existing consumers; expected load/concurrency where it changes the design |
   | Mobile app | Offline behavior; iOS vs Android differences; app store review implications if UI/permissions change; battery/data impact if polling or background work |
   | Database/schema | Migration backward-compatible during deploy, reversible or rollback plan — feeds point 5; impact on existing queries/indexes; backfill for existing records; data volume at expected scale |
   | Bug fix (via lite→full escalation; the lite gate runs the same four inline) | Root cause understood, not the symptom; repro confirmed; same defect looked for elsewhere before patching one spot; regression test added — written first and seen red before the fix, never proved by stashing or reverting the fix — feeds point 4 |
   | Infra/DevOps | Uptime/downtime impact; monitoring/alerting for new failure modes; cost impact (new resources, scaling); scriptable/repeatable, not a manual one-off |
   | Data pipeline/ETL | Source data reliability/format assumptions validated; failure handling for a batch failing midway; reprocessing/backfill strategy; downstream consumers identified |
   | Third-party integration | Rate limits and pricing known; failure/downtime handling; auth/credential management; webhook vs polling decided |
   | UI-only/design | Responsive across breakpoints; accessibility (contrast, keyboard nav, screen reader); design system components reused, not one-offs |

4. **Testing plan:** which logic needs unit coverage; manual/integration cases (including Step 1's edge cases and any domain regression case from point 3); a clear way to verify against Step 1's acceptance criteria. Substantial test work → its own task in point 6.

   Scale target with a number and a way to measure it (benchmark, load script, query plan, timing assertion) → one case names it. No way to measure → say so, one fragment: Step 3.4's diff scan is then the only check.

   **Listed to be run, not filed.** Step 3 executes this set (3.4 per task, 3.8 as a whole), so each case states what runs, what passing looks like, and which task(s) it covers. A case mapped to no task → missing task or misplaced case; a task covered by no case → Step 3.4 falls back to the repo's own checks, a weaker verdict — decide now whether that's acceptable.

5. **Rollout & rollback** — only for stories touching production data, payments, or a migration/backward-compat path (New service/integration usually; Database/schema always; others only if the story says so): feature flag needed?, migration/backward-compat concerns, rollback plan confirmed. Flag/migration/backfill work becomes tasks in point 6, not a footnote.

6. Agreed → break into small tasks along natural seams: dependency order first, then component/layer (multi-part work) or file-module boundary (refactors). Multi-layer stories → name the layers explicitly — frontend (components, state, routing), backend (endpoints, logic), data (schema, migrations), integration points — only the ones touched. Scoped right = one Task Log entry (one What + one Why, no "and also"), ≤3 files. Otherwise split further. Nothing gets appended after point 7's cap check.
   - **Flow:** the ordered file/module list across all tasks — derived directly from the breakdown. Decided here, not revisited unless a Scope Change amends it.
   - **Sequencing:** which tasks have no shared dependency (safe to reorder/hand off), and the smallest independently shippable/demoable slice, if one exists. Recorded (point 9), not just said.

7. Cap total tasks by type — ceiling, not target, applied to the finished list:

   | Type | Max tasks | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — likely misclassified |
   | Small feature | 5 | reconsider — may be "new feature/subsystem" |
   | Refactor | 8 | acceptable upper bound |
   | New feature/subsystem | 10 | **stop, flag** — propose splitting before Step 3 |
   | New service/integration | 10 | same — flag before implementing |
   | Performance | 5 | more usually means multiple bottlenecks — separate stories |

   **Flow size check:** Flow nearing ~30 distinct files → flag, propose splitting, before Step 3. A "Small feature" past ~8 files → raise as possible misclassification.

8. **Constitution check:** `.breadcrumbs/constitution.md` exists → read it once, check the *whole* plan (approach, domain checks, testing, rollout, tasks) against its `status: active` lines before presenting; ignore superseded/retired lines. Runs last on purpose — its rules match content that doesn't exist until points 3-5. Conflict → point-2 tripwire handling. No file → skip silently.

9. File exists → one pass, writing: story type, design depth, HLD/LLD notes, architecture decisions, **Risks/Unknowns**, domain-check outcomes, scale-target outcome, testing plan, rollout/rollback notes, Flow, **Sequencing**, Task Checklist — each only where it applied. No file → stays in chat.
10. **Gate:** investigation marker, then trip marker if a write happened. Present plan + task breakdown, quoted verbatim. Stop, wait for confirmation before implementing (`step3-implement.md`).
