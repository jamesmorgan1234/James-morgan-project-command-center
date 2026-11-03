# Company 113 — Independent Quality, Risk, Negative Test and Gate Matrix

All tests are **test specifications, not claims they ran**. Independent execution must produce recorded pass/fail evidence, code/fixture hashes and exact commit and environment. Critical failure blocks its affected capability, not unrelated companies.

## Domain-specific high consequence errors

1. **R-113-001 Counterfeit product:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
2. **R-113-002 Wrong pack mapping:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
3. **R-113-003 Misleading safety claim:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
4. **R-113-004 Product recall:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
5. **R-113-005 Supplier fake cost data:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
6. **R-113-006 Supplier stock feed stale:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
7. **R-113-007 Marketplace account suspension:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
8. **R-113-008 Unauthorized dropshipping route:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
9. **R-113-009 Negative-margin sale:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
10. **R-113-010 Unexpected taxes or tariff:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
11. **R-113-011 Duplicate supplier order:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
12. **R-113-012 Shipment loss:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
13. **R-113-013 False tracking:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
14. **R-113-014 Return processing delay:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
15. **R-113-015 Duplicate refund:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
16. **R-113-016 Settlement shortfall:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
17. **R-113-017 Currency mix-up:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
18. **R-113-018 Data source rights violation:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
19. **R-113-019 Inventory oversubscription:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
20. **R-113-020 Unauthorized customer communication:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
21. **R-113-021 Owner cash exposure:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
22. **R-113-022 Cross-project credential sharing:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
23. **R-113-023 Supplier purchase during Work task:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.

## First critical tests

- **T-113-CRIT-001:** Unknown fee blocks profit-PASS and live proposal. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-113-CRIT-002:** Supplier pack of 6 never matches individual item. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-113-CRIT-003:** Supplier accepts order but times out: reconcile, never re-buy. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-113-CRIT-004:** Two marketplaces cannot oversell last unit. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-113-CRIT-005:** $0.01 competitor anomaly cannot violate floor. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-113-CRIT-006:** Account restriction freezes affected write intent. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-113-CRIT-007:** Settlement shortfall stays unresolved until evidence. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-113-CRIT-008:** Synthetic order never counted as real revenue. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.

## Invariant families and exit evidence

- **Source/identity:** timestamps, full provenance, source terms and validity; UNKNOWN never converted to verified.
- **Financial:** exact decimal math, cash proof vs estimate, unapproved outbound spend = $0, no duplicate side effects.
- **Domain:** correct entity identity, owner/reviewer authority, current legal/safety rules, repeatable negative fixtures.
- **Brain:** abstain on unsupported claims, uncertainty calibration, adversarial prompt injection, independent critic, rollback.
- **Security:** per-company scope in DB, API, UI, task queue, logs, object storage; zero unauthorized cross-company access.
- **Resilience:** stale feed, bad timestamp, partial write, out-of-order event, retry storm, crashed worker, unknown result; reconcile before retry.
- **UI/build:** project card and unique URL are real, no horizontal overflow, project scope respected, build action persists real job/checkpoint, proof available.
- **Paid/customer gate:** customer consent, correct business email, accurate pricing/contract, no charges or production changes without specific authorization.

## Certification and production levels

`DESIGN_ONLY` → `REGISTERED_PROJECT` → `BUILD_ACTION_VERIFIED` → `TESTED_LOCAL_COMPONENT` → `SANDBOX_CERTIFIED` → `PRODUCTION_SOFTWARE_DEPLOYED` → `LIVE_CUSTOMER_PILOT_APPROVED` → `REAL_RECONCILED_REVENUE`. Never skip intermediate evidence or treat synthetic success as actual sales.

## Safe shutdown

Each connector, price source, project-task executor, notification, seller account, legal gate or industrial data feed needs per-company kill switch. A global platform outage must not silently change cross-company or financial state. Reverse via narrowly scoped transaction/migration only after testing rollback and protecting completed work.
