# Step 2 — Plan

*Lite skips this step.* Zero Material unknowns at Step 1 → folded into 1.6, no separate gate.

Points 3-5 (anything that adds work) run before the breakdown (6), so tasks are cut once and 7's cap applies to the real list.

1. Classify from the confirmed Understanding Summary (already done at 1.4 for lite types). Ask only if genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | "should do Y but does Z" | No HLD/LLD — root cause + fix |
   | Copy/config/content change | text, labels, flags, constants | No design — straight to tasks |
   | Small feature addition | new behavior, existing architecture, no new component | LLD only |
   | Refactor/tech debt | no behavior change | LLD only, scoped to what's restructured |
   | New feature/subsystem | new capability spanning components | Full HLD + LLD |
   | New service/integration | new external dependency or cross-system flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resources, scaling | Profiling findings + targeted fix |

   Type is kind of change, not size; 7's ceilings catch a story that outgrew its type.

2. Approach at that depth, starting *from* the Understanding Summary, never restating it. HLD → components, data flow, integration points. LLD → key functions/classes/schema. No design → the fix, one-two sentences. Same scoped-search rule as Step 1.
   - **Tripwire:** a Material unknown Step 1 missed → stop, ask or log `unconfirmed` (1.3) before continuing. Applies when 1+2 merged.
   - **Architecture decisions:** 2+ valid approaches → pick one, say why, write it down. Cross-team surface (FE/BE) → agree the contract (shape, request/response, error codes) before either side's tasks.
   - **Risks/unknowns:** *implementation* risk — unfamiliar code, needs a spike, could break existing behavior. Open → tripwire. Recorded (9).

**Depth gate for 3-5:**

| Depth | 3-5 |
|---|---|
| No design | Skip 3, 4 — one regression case proves the fix. 5 only for prod data/payments/migration. |
| LLD only | 3: the one domain touched, folded into 2. 4: one line. 5: only if schema/prod-data/payments. |
| Full HLD + LLD | All three, as written. |

Lighter label but real risk (a "small feature" writing a migration) → the risk decides.

3. **Domain checks** — orthogonal to type; skip domains not touched. Findings go into 2 and, if work, into 6. **No re-asking:** auth, errors, compat, scale were scanned in Step 1 — check them against the *plan* silently; a question goes back only via the tripwire.

   **Scale target check** — every depth in full mode, one fragment: walk data-/request-dependent paths against Step 1's target. Holds → say how ("paginated, indexed on `user_id`"). Doesn't or can't tell → tripwire: change approach or log as open risk. "Current scale assumed" → nothing gets worse than today.

   | Domain | Checks |
   |---|---|
   | API/backend | Contract (fields, types, status codes) — feeds 2; auth; rate limiting; idempotency; versioning impact; load where it changes design |
   | Mobile app | Offline; iOS vs Android; store review impact; battery/data for polling/background |
   | Database/schema | Migration backward-compatible and reversible — feeds 5; existing queries/indexes; backfill; volume at target |
   | Bug fix (via escalation) | Root cause not symptom; repro confirmed; same defect elsewhere; regression test — feeds 4 |
   | Infra/DevOps | Downtime; monitoring for new failure modes; cost; scriptable not manual |
   | Data pipeline/ETL | Source format assumptions; mid-batch failure; reprocessing; downstream consumers |
   | Third-party integration | Rate limits/pricing; downtime handling; credentials; webhook vs polling |
   | UI-only/design | Responsive; accessibility (contrast, keyboard, screen reader); design-system components reused |

4. **Testing plan:** unit coverage, manual/integration cases (Step 1 edge cases, domain regression cases), how acceptance criteria get verified. Substantial test work → its own task. Scale target measurable (benchmark, query plan, timing) → one case names it; else say so — 3.4's diff scan is the only check.

   **Listed to be run, not filed.** Each case: what runs, what passing looks like, which task(s) it covers. Case with no task → missing task; task with no case → 3.4 falls back to repo checks, a weaker verdict — decide now if acceptable.

5. **Rollout & rollback** — only for prod data, payments, migration/compat paths: flag?, migration concerns, rollback plan. Flag/migration/backfill work becomes tasks, not a footnote.

6. Break into tasks along seams: dependency order, then layer (FE/BE/data/integration — only those touched) or module boundary. Right size = one What + one Why, ≤3 files; else split. Nothing appended after 7.
   - **Flow:** ordered file/module list across all tasks. Fixed here; changed only via Scope Change.
   - **Sequencing:** tasks with no shared dependency; smallest demoable slice. Recorded (9).

7. Task cap by type — ceiling, applied to the finished list:

   | Type | Max | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — likely misclassified |
   | Small feature | 5 | reconsider — may be new feature/subsystem |
   | Refactor | 8 | upper bound |
   | New feature/subsystem | 10 | **stop, flag** — propose split before Step 3 |
   | New service/integration | 10 | same |
   | Performance | 5 | multiple bottlenecks — separate stories |

   Flow near ~30 files → flag, propose split. "Small feature" past ~8 files → possible misclassification.

8. **Constitution check:** `.breadcrumbs/constitution.md` exists → read once, check the whole plan against `status: active` lines. Conflict → tripwire. No file → skip.

9. File exists, or the long-story checkpoint fires (`SKILL.md`: full, ≥4 tasks) → one write: type, depth, HLD/LLD notes, decisions, Risks/Unknowns, domain/scale outcomes, testing plan, rollout notes, Flow, Sequencing, Task Checklist — only where applied.
10. **Gate:** investigation marker, trip marker if written. Present plan + tasks verbatim; Understanding Summary not re-quoted unless this is the folded 1.6 gate. Checkpoint fired → the `/compact` line after. Stop for confirmation (`step3-implement.md`).
