# Company 115 — Independent Quality, Risk, Negative Test and Gate Matrix

All tests are **test specifications, not claims they ran**. Independent execution must produce recorded pass/fail evidence, code/fixture hashes and exact commit and environment. Critical failure blocks its affected capability, not unrelated companies.

## Domain-specific high consequence errors

1. **R-115-001 False set-aside claim:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
2. **R-115-002 Missing bonding requirement:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
3. **R-115-003 Award mistaken for solicitation:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
4. **R-115-004 Amendment alters deadline:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
5. **R-115-005 Expired notice offered as live:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
6. **R-115-006 Grant confused with bid:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
7. **R-115-007 Keyword false positive:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
8. **R-115-008 Provider API key unavailable:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
9. **R-115-009 Paid portal fee surprise:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
10. **R-115-010 Customer capacity misstatement:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
11. **R-115-011 Gated data scraping violation:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
12. **R-115-012 Source copyright/licensing breach:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
13. **R-115-013 Stale official source:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
14. **R-115-014 Vendor privacy leak:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
15. **R-115-015 Fraudulent procurement notice:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
16. **R-115-016 Phishing file attachment:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
17. **R-115-017 Government endorsement misrepresentation:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
18. **R-115-018 Wrong timezone/DST:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
19. **R-115-019 False promise to win a bid:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
20. **R-115-020 Customer unsubscribed but contacted:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
21. **R-115-021 Duplicate alert spam:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.
22. **R-115-022 Direct conflict with #036 customer account separation:** Introduce the fault synthetically; prove detection, isolate affected entity/company, hold consequential action, preserve evidence and resume only with current trusted source.

## First critical tests

- **T-115-CRIT-001:** API-key-required source does not silently claim free access. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-115-CRIT-002:** Cancelled notice cannot be recommended as active. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-115-CRIT-003:** Bid deadline UTC/local DST correctly distinguished. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-115-CRIT-004:** Set-aside unknown cannot become eligible PASS. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-115-CRIT-005:** Customer lacking bonding evidence gets conditional/not fit. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-115-CRIT-006:** Duplicate cross-portal solicitation generates one alert. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-115-CRIT-007:** Later amendment invalidates earlier match and triggers correction. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.
- **T-115-CRIT-008:** No unsolicited email or bid action. Expected: reject unverified or forbidden action, preserve audit and expose Needs Me when appropriate. No real cash, external account or transaction.

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
