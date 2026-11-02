import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const sqlPath = resolve(process.cwd(), "..", "supabase", "migrations", "20261102090000_p15_16_authoritative_company_project_backfill.sql");
const evidencePath = resolve(process.cwd(), "evidence", "P15_16_COMPANY_PROJECT_BACKFILL.json");

// Minimal faithful subset of the canonical DDL the backfill depends on
// (category3 canonical entities + category5 project registry constraints).
const schema = `
create schema if not exists auth;
create table auth.users (id uuid primary key, created_at timestamptz not null default now());

create table public.command_center_project_types (
  owner_id uuid not null references auth.users(id) on delete cascade,
  type_key text not null,
  version bigint not null default 1 check (version >= 1),
  label text not null,
  domain_playbook_key text not null,
  default_capabilities text[] not null default '{}'::text[],
  required_detail_sections text[] not null default '{}'::text[],
  active boolean not null default true,
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,type_key),
  check (type_key ~ '^project-type:[a-z0-9][a-z0-9._:-]{0,119}$'),
  check (length(btrim(label)) between 1 and 200)
);

create table public.command_center_canonical_entities (
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_id text not null,
  project_id text,
  entity_type text not null,
  version bigint not null default 1 check (version >= 1),
  schema_version integer not null default 1 check (schema_version >= 1),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key(owner_id,entity_id)
);

create table public.command_center_project_profiles (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  canonical_entity_id text not null,
  type_key text not null,
  company_id text,
  name text not null,
  mission text not null,
  lifecycle text not null check (lifecycle in ('candidate','active','paused','blocked','completed','archived','superseded')),
  status text not null,
  verification text not null check (verification in ('verified','implemented_unverified','partial','blocked','unknown')),
  priority text not null check (priority in ('critical','high','normal','low')),
  version bigint not null default 1 check (version >= 1),
  protected boolean not null default false,
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id),
  unique(owner_id,canonical_entity_id),
  foreign key(owner_id,canonical_entity_id) references public.command_center_canonical_entities(owner_id,entity_id) on delete restrict,
  foreign key(owner_id,type_key) references public.command_center_project_types(owner_id,type_key) on delete restrict,
  check (length(btrim(mission)) between 1 and 4000)
);
`;

const owner = "11111111-1111-4111-8111-111111111111";

async function freshDatabase(userCount = 1) {
  const db = new PGlite();
  await db.exec(schema);
  for (let i = 0; i < userCount; i += 1) {
    const id = i === 0 ? owner : `2222222${i}-2222-4222-8222-22222222222${i}`;
    await db.exec(`insert into auth.users(id) values ('${id}')`);
  }
  return db;
}

test("P15.16 backfill: 107 authoritative companies, one distinct project each, contiguous order", () => {
  const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
  assert.equal(evidence.companyCount, 107);
  assert.equal(evidence.companies.length, 107);
  assert.equal(new Set(evidence.companies.map((company) => company.projectId)).size, 107);
  assert.equal(new Set(evidence.companies.map((company) => company.companyId)).size, 107);
  assert.deepEqual(evidence.companies.map((company) => company.sequence), Array.from({ length: 107 }, (_, i) => i + 1));
  assert.equal(evidence.companies[0].projectId, "project:company:future:001");
  assert.equal(evidence.companies.at(-1).projectId, "project:company:future:107");
  for (const company of evidence.companies) {
    assert.match(company.projectId, /^project:company:future:\d{3}$/);
    assert.match(company.companyId, /^company:future:\d{3}$/);
    assert.match(company.source, /^roadmap\/portfolio-future-architecture\/companies\/\d{3}_[A-Z0-9_]+\.md$/);
    assert.ok(company.name.length > 0);
  }
});

test("P15.16 backfill SQL applies cleanly and yields 107 company projects", async () => {
  const db = await freshDatabase(1);
  try {
    await db.exec(readFileSync(sqlPath, "utf8"));
    const profiles = await db.query("select count(*)::int as count from public.command_center_project_profiles");
    assert.equal(profiles.rows[0].count, 107);
    const companies = await db.query("select count(distinct company_id)::int as count from public.command_center_project_profiles");
    assert.equal(companies.rows[0].count, 107);
    const entities = await db.query("select count(*)::int as count from public.command_center_canonical_entities");
    assert.equal(entities.rows[0].count, 107);
    const ordered = await db.query("select project_id from public.command_center_project_profiles order by project_id limit 1");
    assert.equal(ordered.rows[0].project_id, "project:company:future:001");
    const types = await db.query("select type_key, count(*)::int as count from public.command_center_project_profiles group by type_key");
    assert.deepEqual(types.rows, [{ type_key: "project-type:company-build", count: 107 }]);
  } finally {
    await db.close();
  }
});

test("P15.16 backfill SQL is idempotent and never overwrites existing rows", async () => {
  const db = await freshDatabase(1);
  try {
    const sql = readFileSync(sqlPath, "utf8");
    await db.exec(sql);
    await db.exec(`update public.command_center_project_profiles set status='owner-reviewed' where project_id='project:company:future:001'`);
    await db.exec(sql);
    const total = await db.query("select count(*)::int as count from public.command_center_project_profiles");
    assert.equal(total.rows[0].count, 107);
    const edited = await db.query("select status from public.command_center_project_profiles where project_id='project:company:future:001'");
    assert.equal(edited.rows[0].status, "owner-reviewed");
  } finally {
    await db.close();
  }
});

test("P15.16 backfill refuses to run without exactly one owner account", async () => {
  const none = await freshDatabase(0);
  try {
    await assert.rejects(() => none.exec(readFileSync(sqlPath, "utf8")), /exactly one owner account/);
  } finally {
    await none.close();
  }
  const many = await freshDatabase(2);
  try {
    await assert.rejects(() => many.exec(readFileSync(sqlPath, "utf8")), /exactly one owner account/);
  } finally {
    await many.close();
  }
});
