# Step 2 — Plan

*Lite mode skips this step.* Full-mode + zero Material unknowns (Step 1) → also skips the separate gate, folded into 1.6 instead. Decided purely by the Material count from 1.5 — never type, never task/file count. Large multi-file story, nothing genuinely unknown → merges just as readily as a small one.

1. Classify from the confirmed Understanding Summary (already done, 1.4, for lite-eligible types; do it here otherwise). Ask the user only if genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | reported defect, "should do Y but does Z" | No HLD/LLD — root cause + fix approach |
   | Copy/config/content change | text, labels, flags, env values, constants | No design — straight to task list |
   | Small feature addition | new behavior in existing architecture, 1-3 files | LLD only, skip HLD |
   | Refactor/tech debt | no behavior change, restructuring | LLD only, scoped to what's restructured |
   | New feature/subsystem | new capability spanning components | Full HLD + LLD |
   | New service/integration | new external dependency, new cross-system data flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resource usage, scaling | No design doc — profiling findings + targeted fix |

2. Discuss the approach at the depth classification calls for: HLD → system-design level (components, data flow, integration points). LLD → key functions/classes/schema. "No design" → name the fix approach, one-two sentences. Not a formal doc — enough to agree the shape before code.
   - **Tripwire:** plan surfaces a Material unknown Step 1 missed → stop, resolve there (ask / log `unconfirmed` per 1.3 in `step1-understand.md`), before continuing. Applies even when 1+2 merged — a bad merge decision surfaces here, doesn't get built around.
3. Agreed → break into small tasks along natural seams: dependency order first, then component/layer (multi-part work) / file-module boundary (refactors). Scoped right = one Task Log entry (one What + one Why, no "and also"), ≤3 files. Otherwise: split further.
   - **Flow:** the ordered file/module list across all tasks = the story's **Flow** — the set of files this story is expected to touch, and in what order. Derived directly from the task breakdown, no extra thinking. Decided here, at planning, not revisited unless a Scope Change amends it.
4. Cap total tasks by type — ceiling, not target:

   | Type | Max tasks | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — likely misclassified |
   | Small feature | 5 | reconsider — may be "new feature/subsystem" |
   | Refactor | 8 | acceptable upper bound |
   | New feature/subsystem | 10 | **stop, flag** — propose splitting before Step 3 |
   | New service/integration | 10 | same — flag before implementing |
   | Performance | 5 | more usually means multiple bottlenecks — separate stories |

5. File exists → write story type, design depth, Flow, Task Checklist to it, one pass (HLD/LLD notes only if used). No file → stays in chat.
6. **Gate:** trip marker if a write happened. Present plan + task breakdown, quoted verbatim. Stop, wait for confirmation before implementing (`step3-implement.md`).
