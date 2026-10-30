import type { ApprovedScreenKey } from "./visual-references.js";
import type { PrimitiveKind } from "./primitives.js";

export interface ScreenStructureFixture {
  readonly screen: ApprovedScreenKey;
  readonly requiredRegions: readonly string[];
  readonly requiredCardTraits: readonly string[];
}

export const APPROVED_SCREEN_FIXTURES: Readonly<Record<ApprovedScreenKey, ScreenStructureFixture>> = Object.freeze({
  projects: Object.freeze({ screen: "projects", requiredRegions: Object.freeze(["screen_header", "portfolio_summary", "project_list"]), requiredCardTraits: Object.freeze(["left_icon_frame", "title", "support_text", "status_pill", "progress_ring", "right_art", "whole_card_navigation"])}),
  active_live: Object.freeze({ screen: "active_live", requiredRegions: Object.freeze(["screen_header", "active_project_list"]), requiredCardTraits: Object.freeze(["left_icon_frame", "title", "status_pill", "support_text", "scope_or_activity_fact", "right_art", "whole_card_navigation"])}),
  next_up: Object.freeze({ screen: "next_up", requiredRegions: Object.freeze(["screen_header", "priority_queue"]), requiredCardTraits: Object.freeze(["left_icon_frame", "title", "status_pill", "description", "right_art", "whole_card_navigation"])}),
  project_detail_missing_hour: Object.freeze({ screen: "project_detail_missing_hour", requiredRegions: Object.freeze(["screen_header", "project_hero", "performance_grid", "series_strip", "publication_status", "history_row", "integrations_row"]), requiredCardTraits: Object.freeze(["beveled_frame", "orange_illumination", "section_icon", "white_heading", "muted_support"])}),
});

export type RegressionFixtureState = "normal" | "degraded" | "error" | "dense" | "empty" | "stale" | "offline" | "conflict" | "approval";

export interface ComponentRegressionFixture {
  readonly id: string;
  readonly primitive: PrimitiveKind;
  readonly state: RegressionFixtureState;
  readonly deterministicSeed: string;
  readonly fixtureRoute: "/__fixtures";
  readonly providerDependency: "none";
  readonly keyboardCheckRequired: true;
  readonly visualCaptureSupported: true;
}

export function componentRegressionFixture(primitive: PrimitiveKind, state: RegressionFixtureState): ComponentRegressionFixture {
  return Object.freeze({
    id: `fixture:${primitive}:${state}`,
    primitive,
    state,
    deterministicSeed: `command-center-p4:${primitive}:${state}:v1`,
    fixtureRoute: "/__fixtures",
    providerDependency: "none",
    keyboardCheckRequired: true,
    visualCaptureSupported: true
  });
}

export const REQUIRED_REGRESSION_STATES: readonly RegressionFixtureState[] = Object.freeze([
  "normal",
  "degraded",
  "error",
  "dense",
  "empty",
  "stale",
  "offline",
  "conflict",
  "approval"
]);

export function minimumPrimitiveRegressionFixtures(primitive: PrimitiveKind): readonly ComponentRegressionFixture[] {
  return Object.freeze([
    componentRegressionFixture(primitive, "normal"),
    componentRegressionFixture(primitive, "degraded"),
    componentRegressionFixture(primitive, "error")
  ]);
}
