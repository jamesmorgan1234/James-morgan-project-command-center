# Command Center Analytics standard

Analytics turns verified Command Center and Integration facts into useful comparisons without creating a second source of truth.

## Core rule

**Verified source data → canonical metric definition → source-level latest values/history → compatible rollups → trends/goals/anomalies.**

A chart, percentage, total, trend, goal state, or anomaly is never allowed to manufacture missing values. Missing or incompatible data remains `N/A`.

## Seven Analytics phases

1. **Metric Catalog** — canonical metric name, label, unit/value kind, rollup rule, direction, formatting and optional anomaly threshold.
2. **Project KPI Views** — latest verified compatible metrics for one project, preserving source count and observation time.
3. **Portfolio Rollups** — aggregate only metrics whose catalog rule permits aggregation and whose unit/currency match.
4. **Time-Series History** — preserve verified metric observations over time. Integration metrics already retain history; legacy project metrics receive append-only analytics history snapshots.
5. **Trend Comparison** — compare actual verified observations. If there are not enough observations, show `N/A` rather than estimating a trend.
6. **Goal Tracking** — owner-controlled project or portfolio targets measured only against verified Analytics values.
7. **Anomaly Detection** — compare real consecutive observations only when a metric has an explicit anomaly threshold. No threshold means no automatic anomaly claim.

## Source separation

The same provider may have many accounts. Every account remains an independent source in Analytics. Project and portfolio rollups happen only after source-level normalization.

Examples:

- YouTube → VeloClip Main
- YouTube → VeloClip Clips
- Gmail → Company A
- Gmail → Company B

Source-level evidence must remain recoverable even when a higher-level total is displayed.

## Metric catalog rules

Every discovered metric receives an owner-scoped catalog entry. New metrics are registered automatically from real rows in `metrics` or `integration_metrics`; the catalog does not seed fake metric observations.

Supported rollup methods:

- `sum` — compatible numeric source values may be added.
- `average` — compatible numeric source values may be averaged.
- `latest` — use the newest verified observation rather than combining sources.
- `none` — do not produce an aggregate when more than one source is present.

The default is conservative. Percentages and unknown metrics default to `latest`. Canonical revenue/count/social metrics can default to `sum`. A catalog rule may be changed without changing the original source observations.

## Currency and units

Different currencies are never silently combined. Rollups group by metric key, unit and currency. A USD value and EUR value remain separate until a future explicitly verified currency-conversion layer exists.

Likewise, incompatible units are never added together.

## Time-series history

`integration_metrics` is already append-oriented and remains the provider history source.

The legacy `metrics` table is current-state oriented, so Analytics records an append-only verified history row when a legacy metric is created or materially changes. Existing real metrics are backfilled once as their initial Analytics observation.

History rows are evidence. Editing catalog labels, rollup settings, goals or anomaly state does not rewrite the original history.

## Trend rules

Trend displays may show:

- newest verified value
- previous verified value
- absolute change
- percentage change when the prior value is non-zero
- observation timestamps

No interpolation, forecasting or synthetic missing points are allowed in this phase.

## Goals

Goals may target either:

- one project; or
- the portfolio.

A goal stores the metric key, compatible unit/currency when needed, comparison (`>=` or `<=`), target value, optional due date and status.

Goal progress is derived from the current verified Analytics value. A goal does not alter project state or metric history.

## Anomalies

Anomaly detection is deterministic and evidence-based:

- only verified numeric observations are eligible;
- a metric must have an explicit positive `anomaly_threshold_percent` in the catalog;
- the newest observation is compared with the immediately previous observation for the same source/metric/unit/currency;
- prior value zero does not generate a percentage anomaly because the percentage is undefined;
- a finding is inserted only when the absolute percentage change meets or exceeds the configured threshold;
- duplicate scans are idempotent.

An anomaly is a review signal, not a diagnosis. It does not claim a root cause.

## Security

Analytics tables are owner-scoped and use RLS. Browser roles receive only the minimum explicit Data API grants needed by the UI. Views use `security_invoker=true` so underlying RLS remains effective.

No service-role or secret credential belongs in browser code. Public RPCs used by Analytics must reject unauthenticated/unauthorized callers and expose only the exact operation required.

## Completion / truthfulness

Analytics capability completion means the seven-phase engine, UI, security controls and regression protection are implemented and verified. It does **not** mean every external account is connected or every metric has data.

Until real verified sources exist, Analytics must visibly show `N/A` or an empty state rather than placeholder data.