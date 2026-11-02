#!/usr/bin/env node
// P15.16 — authoritative company -> project backfill generator.
//
// Authority: roadmap/portfolio-future-architecture/companies/NNN_*.md, which carry
//   **Company ID:** `company:future:NNN`
//   **Primary project:** `project:company:future:NNN`
//   **Truth state:** PLANNED
// Each company is exactly one canonical project. Nothing here is synthesized beyond
// the identity and purpose text already recorded in those files.
//
// Usage: node scripts/p15-16-company-project-backfill.mjs [--write]

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const companiesDir = join(repoRoot, "roadmap", "portfolio-future-architecture", "companies");
const outSql = join(repoRoot, "supabase", "migrations", "20261102090000_p15_16_authoritative_company_project_backfill.sql");
const outEvidence = join(here, "..", "evidence", "P15_16_COMPANY_PROJECT_BACKFILL.json");
const write = process.argv.includes("--write");

const TYPE_KEY = "project-type:company-build";
const SOURCE_SCHEME = "roadmap/portfolio-future-architecture/companies";

function fail(message) {
  console.error(`p15-16 backfill: ${message}`);
  process.exit(1);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sqlText(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const files = readdirSync(companiesDir)
  .filter((name) => /^\d{3}_[A-Z0-9_]+\.md$/.test(name))
  .sort();

if (files.length === 0) fail("no company source files found");

const companies = files.map((file) => {
  const text = readFileSync(join(companiesDir, file), "utf8");
  const number = Number(file.slice(0, 3));
  const titleLine = text.split("\n").find((line) => line.startsWith("# Company "));
  const companyId = /\*\*Company ID:\*\*\s*`([^`]+)`/.exec(text)?.[1];
  const projectId = /\*\*Primary project:\*\*\s*`([^`]+)`/.exec(text)?.[1];
  const truthState = /\*\*Truth state:\*\*\s*([A-Z_]+)/.exec(text)?.[1] ?? "PLANNED";
  const purpose = /^Purpose:\s*(.+)$/m.exec(text)?.[1]?.trim();
  const name = titleLine ? titleLine.replace(/^# Company \d{3}\s*[—–-]\s*/, "").trim() : undefined;

  if (!companyId) fail(`${file}: missing Company ID`);
  if (!projectId) fail(`${file}: missing Primary project`);
  if (!name) fail(`${file}: missing canonical title`);
  if (!purpose) fail(`${file}: missing Purpose`);
  if (companyId !== `company:future:${String(number).padStart(3, "0")}`) fail(`${file}: company id does not match file ordinal`);
  if (projectId !== `project:company:future:${String(number).padStart(3, "0")}`) fail(`${file}: project id does not match file ordinal`);

  return Object.freeze({
    sequence: number,
    file,
    companyId,
    projectId,
    name,
    mission: purpose.length > 900 ? `${purpose.slice(0, 897)}...` : purpose,
    truthState,
    lifecycle: "candidate",
    status: truthState === "PLANNED" ? "planned" : truthState.toLowerCase(),
    verification: "unknown",
    priority: "normal"
  });
});

const seenIds = new Set();
for (const company of companies) {
  if (seenIds.has(company.projectId)) fail(`duplicate project id ${company.projectId}`);
  seenIds.add(company.projectId);
}
const sequences = companies.map((company) => company.sequence);
for (let i = 0; i < sequences.length; i += 1) {
  if (sequences[i] !== i + 1) fail(`company ordinals are not contiguous at position ${i + 1}: found ${sequences[i]}`);
}

const entityPayload = (company) => JSON.stringify({
  schemaVersion: 1,
  companyId: company.companyId,
  projectId: company.projectId,
  sequence: company.sequence,
  truthState: company.truthState,
  source: `${SOURCE_SCHEME}/${company.file}`
});

const manifest = {
  schemaVersion: 1,
  phaseId: "P15.16",
  kind: "authoritative_company_project_backfill",
  sourceAuthority: SOURCE_SCHEME,
  companyCount: companies.length,
  orderingRule: "company ordinal embedded in the authoritative file name (001..NNN), preserved in project_id",
  inventoryDigest: sha256(companies.map((company) => `${company.sequence}|${company.companyId}|${company.projectId}|${company.name}`).join("\n")),
  companies: companies.map((company) => ({
    sequence: company.sequence,
    companyId: company.companyId,
    projectId: company.projectId,
    name: company.name,
    source: `${SOURCE_SCHEME}/${company.file}`
  }))
};

if (companies.length !== 107) {
  fail(`authoritative company count is ${companies.length}, expected 107 (do not pad or omit)`);
}

const valuesProfiles = companies.map((company) => `    (v_owner, ${sqlText(company.projectId)}, ${sqlText(company.projectId)}, ${sqlText(TYPE_KEY)}, ${sqlText(company.companyId)}, ${sqlText(company.name)}, ${sqlText(company.mission)}, ${sqlText(company.lifecycle)}, ${sqlText(company.status)}, ${sqlText(company.verification)}, ${sqlText(company.priority)}, ${sqlText(`${SOURCE_SCHEME}/${company.file}`)})`).join(",\n");

const valuesEntities = companies.map((company) => {
  const payload = entityPayload(company);
  return `    (v_owner, ${sqlText(company.projectId)}, ${sqlText(company.projectId)}, 'company-project', ${sqlText(payload)}::jsonb, ${sqlText(sha256(payload))})`;
}).join(",\n");

const sql = `-- P15.16 authoritative COMPANY -> PROJECT backfill.
-- Generated by scripts/p15-16-company-project-backfill.mjs --write. Do not hand-edit.
--
-- Authority: ${SOURCE_SCHEME}/001..${String(companies.length).padStart(3, "0")}
-- Each authoritative company is exactly one canonical project (one company = one project).
-- Ordering is the authoritative company ordinal carried by project_id, not alphabetical
-- and not insertion order.
--
-- This migration is idempotent: existing rows are preserved, never overwritten, and it
-- never weakens RLS. It must be applied by a privileged role (service role / SQL editor).

begin;

do $$
declare
  v_owner uuid;
  v_owner_count integer;
  v_profiles integer;
  v_expected integer := ${companies.length};
begin
  select count(*) into v_owner_count from auth.users;
  if v_owner_count <> 1 then
    raise exception 'P15.16 backfill expects exactly one owner account, found %', v_owner_count;
  end if;
  select id into v_owner from auth.users limit 1;

  insert into public.command_center_project_types(
    owner_id, type_key, version, label, domain_playbook_key, default_capabilities,
    required_detail_sections, active, source_ref
  ) values (
    v_owner, ${sqlText(TYPE_KEY)}, 1, 'Company build project', 'portfolio-company-build',
    '{}'::text[], '{}'::text[], true, ${sqlText(SOURCE_SCHEME)}
  ) on conflict (owner_id, type_key) do nothing;

  insert into public.command_center_canonical_entities(
    owner_id, entity_id, project_id, entity_type, payload, content_hash
  ) values
${valuesEntities}
  on conflict (owner_id, entity_id) do nothing;

  insert into public.command_center_project_profiles(
    owner_id, project_id, canonical_entity_id, type_key, company_id, name, mission,
    lifecycle, status, verification, priority, source_ref
  ) values
${valuesProfiles}
  on conflict (owner_id, project_id) do nothing;

  select count(*) into v_profiles
    from public.command_center_project_profiles
    where owner_id = v_owner and source_ref like ${sqlText(`${SOURCE_SCHEME}/%`)};
  if v_profiles < v_expected then
    raise exception 'P15.16 backfill inserted/retained % of % company projects', v_profiles, v_expected;
  end if;
  raise notice 'P15.16 company projects present: % (expected %)', v_profiles, v_expected;
end $$;

commit;
`;

if (write) {
  writeFileSync(outSql, sql);
  writeFileSync(outEvidence, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(JSON.stringify({
  ok: true,
  written: write,
  companyCount: manifest.companyCount,
  firstProjectId: companies[0].projectId,
  lastProjectId: companies.at(-1).projectId,
  inventoryDigest: manifest.inventoryDigest,
  sql: write ? outSql : null
}));
