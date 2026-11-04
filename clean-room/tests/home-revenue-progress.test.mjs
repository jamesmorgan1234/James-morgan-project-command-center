import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarizeRecordedRevenue } from "../dist/runtime/revenue-summary.js";

test("Revenue Home card preserves an evidence-backed verified $0 instead of N/A", () => {
  const summary = summarizeRecordedRevenue([
    { project_id: "company-one", metric_key: "verified_revenue_usd", verified: true, currency: "USD", value_numeric: "0", observed_at: "2026-10-19T00:00:00Z" },
    { project_id: "company-two", metric_key: "verified_revenue_usd", verified: true, currency: "USD", value_numeric: 0, observed_at: "2026-10-22T00:00:00Z" }
  ]);
  assert.equal(summary?.amountUsd, 0);
  assert.equal(summary?.projectCount, 2);
  assert.equal(summary?.latestObservedAt, "2026-10-22T00:00:00Z");
  assert.equal(summary?.basis, "verified_recorded_projects");
});

test("Revenue projection deduplicates newer project snapshots and excludes unverified or other currencies", () => {
  const summary = summarizeRecordedRevenue([
    { project_id: "a", metric_key: "verified_revenue_usd", verified: true, currency: "USD", value_numeric: "0", observed_at: "2026-10-19T00:00:00Z" },
    { project_id: "a", metric_key: "verified_revenue_usd", verified: true, currency: "USD", value_numeric: "12.34", observed_at: "2026-10-20T00:00:00Z" },
    { project_id: "b", metric_key: "verified_revenue_usd", verified: true, currency: "USD", value_numeric: "2.20", observed_at: "2026-10-21T00:00:00Z" },
    { project_id: "c", metric_key: "verified_revenue_usd", verified: false, currency: "USD", value_numeric: "999", observed_at: "2026-10-22T00:00:00Z" },
    { project_id: "d", metric_key: "verified_revenue_usd", verified: true, currency: "EUR", value_numeric: "999", observed_at: "2026-10-22T00:00:00Z" }
  ]);
  assert.equal(summary?.amountUsd, 14.54);
  assert.equal(summary?.projectCount, 2);
});

test("Revenue cannot be shown as a verified zero without verified revenue evidence", () => {
  assert.equal(summarizeRecordedRevenue([]), undefined);
  assert.equal(summarizeRecordedRevenue([{ project_id: "x", metric_key: "verified_revenue_usd", verified: false, currency: "USD", value_numeric: 0, observed_at: "2026-10-19T00:00:00Z" }]), undefined);
});

test("Home revenue card remains a real link with a centrally positioned dollar amount and qualified freshness", () => {
  const browser = readFileSync(new URL("../src/runtime/browser.ts", import.meta.url), "utf8");
  const css = readFileSync(new URL("../public/home-approved-imagery.css", import.meta.url), "utf8");
  const provider = readFileSync(new URL("../src/runtime/supabase-owner-provider.ts", import.meta.url), "utf8");
  assert.match(browser, /key: "revenue", title: "Revenue", route: "\/finance"/);
  assert.match(browser, /home-revenue__amount/);
  assert.match(css, /\.home-primary-card--revenue\{/);
  assert.match(css, /\.home-revenue__amount\{/);
  assert.match(provider, /summarizeRecordedRevenue\(revenueRecords\)/);
});

import { verifiedWorkUnitPercent, formatProgressPercent } from "../dist/runtime/progress-precision.js";
import { ownerRealtimeJoin, OWNER_REALTIME_TABLES } from "../dist/runtime/owner-realtime.js";

test("Verified work-unit progress retains two decimal places and does not use whole-percent rounding", () => {
  const units = [
    { applicable: true, status: "verified" },
    { applicable: true, status: "planned" },
    { applicable: true, status: "planned" },
    { applicable: false, status: "planned" }
  ];
  assert.equal(verifiedWorkUnitPercent(units), 33.33);
  assert.equal(formatProgressPercent(33.33), "33.33%");
  assert.equal(verifiedWorkUnitPercent([{ applicable: true, status: "planned" }]), 0);
  assert.equal(verifiedWorkUnitPercent([{ applicable: false, status: "verified" }]), undefined);
});

test("Realtime subscription contains only authenticated Postgres Change filters and no generic public channel", () => {
  const join = JSON.parse(ownerRealtimeJoin("test-owner-jwt"));
  assert.equal(join.event, "phx_join");
  assert.equal(join.payload.access_token, "test-owner-jwt");
  assert.equal(join.payload.config.private, false);
  assert.ok(OWNER_REALTIME_TABLES.includes("command_center_project_work_units"));
  assert.ok(OWNER_REALTIME_TABLES.includes("analytics_metric_history"));
  assert.equal(join.payload.config.postgres_changes.length, OWNER_REALTIME_TABLES.length);
  assert.ok(join.payload.config.postgres_changes.every((filter) => filter.schema === "public" && filter.event === "*"));
  assert.throws(() => ownerRealtimeJoin(""));
});

test("Live screen updates use owner-authenticated event subscription and safe fallback", () => {
  const browser = readFileSync(new URL("../src/runtime/browser.ts", import.meta.url), "utf8");
  const managed = readFileSync(new URL("../src/runtime/owner-security-provider.ts", import.meta.url), "utf8");
  assert.match(browser, /activeProvider\\?\\.watchChanges/);
  assert.match(browser, /startOwnerLiveRefresh\\(snapshot\\)/);
  assert.match(browser, /queueOwnerLiveRefresh/);
  assert.match(managed, /watchChanges\\(onChanged:/);
});
