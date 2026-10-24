import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261024122000_category3_protocol_adapter_registry.sql", import.meta.url), "utf8");

test("P3.11 persists vendor-neutral MCP/A2A/custom adapter contracts", () => {
  assert.match(sql, /create table if not exists public\.command_center_protocol_adapters/i);
  assert.match(sql, /protocol in \('mcp','a2a','custom'\)/i);
  assert.match(sql, /capabilities text\[]/i);
  assert.match(sql, /security_route_key text not null/i);
  assert.match(sql, /provider_key text/i);
  assert.match(sql, /command_center_protocol_adapter_versions/i);
});

test("P3.11 adapter replacement is optimistic/versioned and core-independent", () => {
  assert.match(sql, /command_center_register_protocol_adapter/i);
  assert.match(sql, /command_center_replace_protocol_adapter/i);
  assert.match(sql, /Protocol adapter version conflict/i);
  assert.match(sql, /v_next:=a\.version\+1/i);
  assert.match(sql, /operation in \('register','replace','disable','retire'\)/i);
});

test("P3.11 protocol configuration rejects confidential material and requires security routing", () => {
  assert.match(sql, /Protocol adapter requires a security route/i);
  assert.match(sql, /use provider credential references/i);
  assert.match(sql, /Bearer\[\[:space:\]\]\+/i);
  assert.match(sql, /secret\|token\|password/i);
});

test("P3.11 protocol registry is owner-scoped read-only to browser roles", () => {
  assert.match(sql, /revoke all on table public\.command_center_protocol_adapters from public,anon,authenticated/i);
  assert.match(sql, /grant select on table public\.command_center_protocol_adapters to authenticated/i);
  assert.match(sql, /owner_id=\(select auth\.uid\(\)\).*is_command_center_authorized/i);
});
