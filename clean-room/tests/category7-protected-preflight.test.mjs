import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertProtectedPreflight } from "../dist/agency/protected.js";

const migrationUrl = new URL("../../supabase/migrations/20261024170000_category7_protected_preflight.sql", import.meta.url);

test("P7.20 durable protected preflight validates exact live scope without consuming authorization", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const blocker of ["run_not_working","project_agent_generation_or_run_mismatch","project_lock_missing","context_scope_mismatch","context_generation_stale","context_stale","authorization_missing","authorization_not_available","authorization_scope_mismatch","authorization_expired","authorization_freshness_missing","authorization_session_not_live","authorization_session_or_device_revoked","provider_unavailable","credential_reference_missing","credential_scope_denied","artifact_missing_or_hash_mismatch"]) assert.match(sql, new RegExp(blocker));
  assert.match(sql, /authorization_consumed',false/);
  assert.match(sql, /protected_side_effect_executed',false/);
  assert.doesNotMatch(sql, /consume_action_authorization\(/);
  assert.match(sql, /security_action_authorizations/);
});

test("P7.20 runtime protected preflight rejects wrong project, stale auth, provider health and credential scope", () => {
  const good = { projectId: "p", projectLockProjectId: "p", requestedScopes: ["repo:write"], credential: { id: "cred", provider: "git", allowedScopes: ["repo:write"], projectId: "p" }, toolHealthy: true, authorizationFresh: true, protectedActionAuthorized: true };
  assert.doesNotThrow(() => assertProtectedPreflight(good));
  assert.throws(() => assertProtectedPreflight({ ...good, projectLockProjectId: "other" }), /Project lock\/credential project mismatch/);
  assert.throws(() => assertProtectedPreflight({ ...good, authorizationFresh: false }), /fresh exact authorization/);
  assert.throws(() => assertProtectedPreflight({ ...good, toolHealthy: false }), /health/);
  assert.throws(() => assertProtectedPreflight({ ...good, requestedScopes: ["money:write"] }), /Credential scope denied/);
});
