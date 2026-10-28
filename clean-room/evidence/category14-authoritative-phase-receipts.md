# Category 14 authoritative phase receipts

Current status: **PASS_ISOLATED_RECOVERY**, P14.1–P14.12.

The former twelve advisory receipt validators are retained for backward compatibility.
They are not sufficient certification alone. Current executable evidence is:

- `CATEGORY_14_RECOVERY_MIGRATION_SCALE_ACCEPTANCE.md` — implementation and boundary.
- `category14-acceptance-matrix.json` — exact phase names/scopes/exits, 61 execution
  requirements, 115 unique current Amendment 20 atoms, implementation/test/DB mappings.
- `npm run gate:category14` — 120 mandatory passing tests with no failures/skips/cancels.
- `tests/p14-*.test.mjs` — 37 focused passing tests, including actual isolated encrypted
  restore/migration/retention/database/fencing/replay/lifecycle and C2 negative cases.

Category 13: 85 passing regression tests. Category 12: 123 passing regression tests.
Full build: 1,558 passing tests. No production/live/owner/device/Category 15 acceptance
is implied. No spending or protected production action occurred.
