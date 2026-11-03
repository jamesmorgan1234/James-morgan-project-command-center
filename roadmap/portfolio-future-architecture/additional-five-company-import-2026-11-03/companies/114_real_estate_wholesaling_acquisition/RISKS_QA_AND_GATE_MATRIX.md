# Company 114 — Independent Quality, Risk, Negative Test and Gate Matrix

All tests are **test specifications, not claims they ran**. Independent execution must produce recorded pass/fail evidence, code/fixture hashes and exact commit and environment. Critical failure blocks its affected capability, not unrelated companies.

## Domain-specific high consequence errors

1. **R-114-001 Incorrect seller identity:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
2. **R-114-002 Ownership dispute:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
3. **R-114-003 False distress inference:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
4. **R-114-004 Outdated property tax:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
5. **R-114-005 Inaccurate ARV:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
6. **R-114-006 Underestimated rehab:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
7. **R-114-007 Hidden lien:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
8. **R-114-008 Nonassignable contract:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
9. **R-114-009 Missing Ohio required disclosure:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
10. **R-114-010 Unlicensed brokerage activity:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
11. **R-114-011 Seller vulnerability exploitation:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
12. **R-114-012 Misleading promises:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
13. **R-114-013 TCPA/DNC violation:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
14. **R-114-014 Wrong contact data:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
15. **R-114-015 Probate authority uncertainty:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
16. **R-114-016 Buyer lacks cash:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
17. **R-114-017 Buyer backs out:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
18. **R-114-018 Title delay:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
19. **R-114-019 Contract imposes liability without deposit:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
20. **R-114-020 Earnest money forfeiture:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
21. **R-114-021 Fraudulent wire instructions:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
22. **R-114-022 Recorded deed scam:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
23. **R-114-023 Miscounted revenue:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
24. **R-114-024 Privacy breach:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
25. **R-114-025 Cross-project account sharing:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.

## First critical tests

- **T-114-CRIT-001:** Below $3k spread is rejected. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-114-CRIT-002:** Gross spread $3–5k weak and default ≥5k. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-114-CRIT-003:** Taxes owed never taken as seller asking price. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-114-CRIT-004:** Missing signed Ohio statutory disclosure blocks contract workflow. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-114-CRIT-005:** Earnest money proposed without owner approval blocks. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-114-CRIT-006:** Verbal buyer interest not considered proof of funds. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-114-CRIT-007:** No settlement proof means no realized revenue. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-114-CRIT-008:** Seller opt-out prevents contact. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-114-CRIT-009:** Agent cannot sign or purchase property. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.

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
