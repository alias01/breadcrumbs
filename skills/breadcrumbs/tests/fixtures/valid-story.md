# PARK-482: Fix duplicate charge on payment retry
Status: implementing

## Original Story
Retrying a failed payment creates a second charge. Should reuse the original attempt.

## Understanding Summary
Retry path omits idempotency key — provider treats each retry as new charge. Confirmed by user on 2026-08-11.

## Clarifying Q&A
- Q: key scoped per order or per attempt? — A: per order.

## Assumptions
- Provider honors `Idempotency-Key` header — reason: documented in their API v2 — status: confirmed by user on 2026-08-11

## Current Requirements
One idempotency key per order, forwarded on every retry. Existing in-flight retries unaffected.

## Plan
Story type: bug fix
Root cause: `retryCharge()` builds a fresh request, drops the key. Fix: generate key at order creation, thread through retry path.

### Risks / Unknowns
- Orders created before this ship have no key — status: resolved: fall back to order id

### Sequencing
Tasks 1 and 2 independent. Task 1 alone is shippable.

## Flow
1. src/payments/order.ts (Task 1)  2. src/payments/retry.ts (Task 2)

## Task Checklist
- [x] Task 1 — generate idempotency key at order creation — files: src/payments/order.ts
- [ ] Task 2 — forward key on retry — files: src/payments/retry.ts

## Task Log
### Task 1 — 2026-08-11
- What: key generated in `createOrder`, persisted on order row.
- Why: per-order scope (Q&A above) — attempt-scoped key would defeat the point.

## Verification
Last run: 2026-08-12 — `npm test -- payments` — green
Scope: payments package only — full suite is 11min

## Scope Changes / Reimplementation

## Gate Waivers

## PR Summary
