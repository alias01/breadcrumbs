# Step 2 — Plan

*Lite skips this step.* Zero Material unknowns → folded into 1.6.

3-5 (anything adding work) run before 6, so tasks are cut once and 7's cap sees the real list.

1. Classify from the confirmed summary (lite types: done at 1.4). Ask only if genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | "should do Y but does Z" | Root cause + fix, no HLD/LLD |
   | Copy/config/content change | text, labels, flags, constants | No design |
   | Small feature addition | new behavior, existing architecture | LLD only |
   | Refactor/tech debt | no behavior change | LLD, restructured part only |
   | New feature/subsystem | new capability spanning components | Full HLD + LLD |
   | New service/integration | new external dependency / cross-system flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resources, scaling | Profiling + targeted fix |

   Type = kind of change, not size; 7 catches one that outgrew its type.

2. Approach at that depth, starting *from* the summary, never restating it. HLD → components, data flow, integration points. LLD → key functions/classes/schema. No design → the fix in 1-2 sentences.
   - **Tripwire:** Material unknown Step 1 missed → stop, ask or log `unconfirmed` (1.3). Applies when 1+2 merged.
   - **Architecture decisions:** 2+ valid approaches → pick one, say why, write it down. BE+FE story (monorepo or not) → **contract-first** (6).
   - **Risks:** *implementation* risk — unfamiliar code, needs a spike, may break behavior. Open → tripwire. Recorded (9).

**Depth gate for 3-5:**

| Depth | 3-5 |
|---|---|
| No design | Skip 3, 4 — one regression case. 5 only for prod data/payments/migration. |
| LLD only | 3: the one domain, folded into 2. 4: one line. 5: only schema/prod-data/payments. |
| Full HLD + LLD | All three. |

Light label, real risk (small feature + migration) → the risk decides.

3. **Domain checks** — orthogonal to type; skip untouched domains. Findings → 2, work → 6. **No re-asking:** auth, errors, compat, scale were scanned in Step 1 — check against the *plan* silently; questions only via the tripwire.

   **Scale target check** — every full-mode depth, one fragment: walk data-/request-dependent paths against Step 1's target. Holds → say how ("paginated, indexed on `user_id`"). Doesn't / can't tell → tripwire: change approach or log open risk. "Current scale assumed" → nothing worse than today.

   | Domain | Checks |
   |---|---|
   | API/backend | Contract (fields, types, status codes) → 2; auth; rate limits; idempotency; versioning; load where it changes design |
   | Mobile app | Offline; iOS vs Android; store review; battery/data for background work |
   | Database/schema | Migration backward-compatible + reversible → 5; existing queries/indexes; backfill; volume at target |
   | Bug fix (escalated) | Root cause not symptom; repro; same defect elsewhere; regression test → 4 |
   | Infra/DevOps | Downtime; monitoring new failure modes; cost; scripted not manual |
   | Data pipeline/ETL | Source format; mid-batch failure; reprocessing; downstream consumers |
   | Third-party integration | Rate limits/pricing; downtime; credentials; webhook vs polling |
   | UI-only/design | Responsive; a11y (contrast, keyboard, screen reader); reuse design-system components |

4. **Testing plan — minimal, test-first** (`step3-implement.md` 4). One smoke case per thing touched: backend endpoint → happy path, status + shape vs contract fixture (error case only if named) · frontend screen → renders fixture data, key element visible · bug fix → regression, red on unfixed code · refactor → characterization, green on current code, first · copy/config → one assertion on the new value.

   Plus how acceptance criteria get verified. Substantial test work → own task. Scale target measurable (benchmark, query plan, timing) → one case names it; else say so — 3.4's scan is the only check.

   **Listed to be run, not filed.** Each case: what runs, what passing looks like, which task(s). Case with no task → missing task; task with no case → weaker repo-check verdict at 3.4 — decide now if acceptable.

5. **Rollout & rollback** — only prod data, payments, migration/compat: flag?, migration, rollback plan. Flag/migration/backfill work = tasks, not footnotes.

6. Break into tasks along seams: dependency order, then layer (FE/BE/data/integration, touched only) or module. Right size = one What + one Why, ≤3 files; else split. Nothing appended after 7.
   - **Flow:** ordered file/module list across tasks. Fixed here; changes only via Scope Change.
   - **Sequencing:** independent tasks; smallest demoable slice. Recorded (9).
   - **Contract-first** (BE+FE story): task 1 = request/response/error shapes where shared types live (workspace pkg, OpenAPI, zod; else co-located) + **one fixture**, a canonical response; no logic. Then BE tasks (smoke asserts vs fixture), then FE tasks (smoke renders the *same fixture*) — fixture = drift detector. Frozen after task 1; change → Scope Change, re-run both. Counts toward 7. BE- or FE-only → skip.

7. Task cap by type — ceiling, applied to the finished list:

   | Type | Max | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — misclassified? |
   | Small feature | 5 | reconsider — maybe new feature |
   | Refactor | 8 | upper bound |
   | New feature / service | 10 | **stop, flag** — propose split before Step 3 |
   | Performance | 5 | several bottlenecks → split |

   Flow near ~30 files → flag, propose split. "Small feature" past ~8 files → likely misclassified.

8. **Constitution:** `.breadcrumbs/constitution.md` exists → read once, check the plan against `status: active` lines. Conflict → tripwire.

9. File exists → one write: type, depth, design notes, decisions, Risks, domain/scale outcomes, testing plan, rollout, Flow, Sequencing, Checklist — where applied.
10. **Gate:** investigation marker, trip marker if written. Plan + tasks verbatim; summary not re-quoted unless folded 1.6 gate. Stop for confirmation (`step3-implement.md`).
