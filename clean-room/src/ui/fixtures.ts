import type { ApprovedScreenKey } from "./visual-references.js";

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
