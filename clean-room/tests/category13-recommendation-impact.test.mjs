import test from "node:test";
import assert from "node:assert/strict";
import {
  recommendationSecurityImpact,
  linkAcceptedRecommendation,
  linkImplementedRecommendation
} from "../dist/analytics/index.js";

test("P13.6 recommendation security impact requires review for authorization changes", () => {
  const none = recommendationSecurityImpact({ touchesProtectedData: false, changesAuthorization: false, addsExternalIntegration: false });
  assert.equal(none.risk, "none");
  assert.equal(none.reviewRequired, false);
  const review = recommendationSecurityImpact({ touchesProtectedData: true, changesAuthorization: false, addsExternalIntegration: false });
  assert.equal(review.risk, "review_required");
  assert.equal(review.reviewRequired, true);
  assert.deepEqual([...review.reasons], ["touches_protected_data"]);
  const protectedChange = recommendationSecurityImpact({ touchesProtectedData: false, changesAuthorization: true, addsExternalIntegration: true });
  assert.equal(protectedChange.risk, "protected");
  assert.deepEqual([...protectedChange.reasons], ["changes_authorization", "adds_external_integration"]);
});

test("P13.6 accepted recommendation links to a roadmap unit", () => {
  const link = linkAcceptedRecommendation("rec-1", "roadmap:unit-7");
  assert.equal(link.status, "accepted");
  assert.equal(link.roadmapUnitRef, "roadmap:unit-7");
  assert.throws(() => linkAcceptedRecommendation("rec-1", " "), /roadmap unit reference/);
  assert.throws(() => linkAcceptedRecommendation(" ", "roadmap:unit-7"), /recommendation id/);
});

test("P13.6 implemented recommendation links to release evidence", () => {
  const link = linkImplementedRecommendation("rec-1", "release:2026-10-31");
  assert.equal(link.status, "implemented");
  assert.equal(link.releaseEvidenceRef, "release:2026-10-31");
  assert.throws(() => linkImplementedRecommendation("rec-1", ""), /release evidence/);
  assert.throws(() => linkImplementedRecommendation("", "release:2026-10-31"), /recommendation id/);
});
