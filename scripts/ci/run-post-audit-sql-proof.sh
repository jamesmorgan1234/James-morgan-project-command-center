#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:=127.0.0.1}"
: "${PGPORT:=5432}"
: "${PGUSER:=postgres}"
: "${PGPASSWORD:=postgres}"
export PGHOST PGPORT PGUSER PGPASSWORD

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIG="$ROOT/supabase/migrations"
BOOTSTRAP="$ROOT/scripts/ci/post-audit-postgres-bootstrap.sql"
OUT="$ROOT/audit-output/post-audit-sql-proof.log"
mkdir -p "$(dirname "$OUT")"
: > "$OUT"

log() { printf '%s\n' "$*" | tee -a "$OUT"; }
run_psql() {
  local db="$1"; shift
  psql -X -v ON_ERROR_STOP=1 -d "$db" "$@" 2>&1 | tee -a "$OUT"
}
apply_file() {
  local db="$1" file="$2"
  log "APPLY [$db] ${file#$ROOT/}"
  run_psql "$db" -f "$file"
}

BASELINE=(
  # Category 3 canonical/source/provider foundation.
  "20261024112000_category3_canonical_platform.sql"
  "20261024113000_category3_sync_reconciliation.sql"
  "20261024113500_category3_import_policy_extension.sql"
  "20261024114000_category3_knowledge_provenance_invariant.sql"
  "20261024115000_category3_portability_batches.sql"
  "20261024120000_category3_historical_export_staging.sql"
  "20261024121000_category3_context_artifact_exchange.sql"
  "20261024122000_category3_protocol_adapter_registry.sql"
  "20261024123000_category3_recovery_scale_evidence.sql"

  # Category 5 project/roadmap/checkpoint prerequisites used by Agency.
  "20261024130000_category5_project_registry.sql"
  "20261024132000_category5_roadmap_engine.sql"
  "20261024132100_category5_roadmap_verification_gate_fix.sql"
  "20261024132200_category5_roadmap_authoring_rpc.sql"
  "20261024133000_category5_project_checkpoints.sql"

  # Category 7 durable Agency baseline through recovery/failover.
  "20261024152500_category7_run_job_task_state.sql"
  "20261024153000_category7_project_agent_state.sql"
  "20261024153500_category7_executor_registry.sql"
  "20261024154000_category7_scheduler_leadership.sql"
  "20261024154500_category7_task_claims.sql"
  "20261024155000_category7_resource_claims.sql"
  "20261024155500_category7_dependency_scheduler.sql"
  "20261024160000_category7_context_packets.sql"
  "20261024160500_category7_project_auto.sql"
  "20261024161000_category7_agent_auto_portfolio.sql"
  "20261024161500_category7_boundary_office.sql"
  "20261024162000_category7_work_ladder.sql"
  "20261024162500_category7_dynamic_organization.sql"
  "20261024163000_category7_autonomy_decision_rights.sql"
  "20261024163500_category7_delegation.sql"
  "20261024164000_category7_independent_verification.sql"
  "20261024164500_category7_integration_arbitration.sql"
  "20261024165000_category7_shift_manager.sql"
  "20261024165500_category7_pause_stop_kill.sql"
  "20261024165900_category7_context_packet_owner_key.sql"
  "20261024170000_category7_protected_preflight.sql"
  "20261024170500_category7_deterministic_replay.sql"
  "20261024171000_category7_canary_rollout.sql"
  "20261024171500_category7_recovery_failover.sql"
)

RETROFIT=(
  "20261025011500_category3_source_provenance_refresh_retrofit.sql"
  "20261025013000_category7_distributed_work_hardening.sql"
  "20261025014500_category7_side_effect_outbox_inbox.sql"
  "20261025020000_category7_resource_quota_usage_governor.sql"
  "20261025020100_category7_resource_quota_usage_reconciliation_hardening.sql"
)

for f in "${BASELINE[@]}" "${RETROFIT[@]}"; do
  test -s "$MIG/$f" || { log "MISSING migration: $f"; exit 1; }
done

dropdb --if-exists cc_a11_clean >/dev/null 2>&1 || true
dropdb --if-exists cc_a11_prior >/dev/null 2>&1 || true
createdb cc_a11_clean
createdb cc_a11_prior

for db in cc_a11_clean cc_a11_prior; do
  log "BOOTSTRAP [$db] Supabase platform primitives"
  run_psql "$db" -f "$BOOTSTRAP"
done

log "=== A11.2 CLEAN-SCHEMA PATH: baseline + retrofit from a fresh disposable database ==="
for f in "${BASELINE[@]}"; do apply_file cc_a11_clean "$MIG/$f"; done
for f in "${RETROFIT[@]}"; do apply_file cc_a11_clean "$MIG/$f"; done

log "=== A11.2 PRIOR-SUPPORTED PATH: establish predecessor schema first ==="
for f in "${BASELINE[@]}"; do apply_file cc_a11_prior "$MIG/$f"; done

log "ASSERT [cc_a11_prior] post-audit retrofit is absent before upgrade"
run_psql cc_a11_prior -Atqc "
  select case
    when to_regclass('public.command_center_source_registry') is not null then 1/0
    when to_regclass('public.command_center_agency_side_effect_outbox') is not null then 1/0
    when to_regclass('public.command_center_resource_quota_buckets') is not null then 1/0
    else 1
  end;
"

log "=== A11.2 PRIOR-SUPPORTED PATH: apply only post-audit retrofit migrations ==="
for f in "${RETROFIT[@]}"; do apply_file cc_a11_prior "$MIG/$f"; done

for db in cc_a11_clean cc_a11_prior; do
  log "ASSERT [$db] required retrofit tables and RPCs exist"
  run_psql "$db" -Atqc "
    select case when
      to_regclass('public.command_center_source_registry') is not null
      and to_regclass('public.command_center_source_refresh_runs') is not null
      and to_regclass('public.command_center_agency_side_effect_outbox') is not null
      and to_regclass('public.command_center_agency_side_effect_inbox') is not null
      and to_regclass('public.command_center_resource_quota_buckets') is not null
      and to_regclass('public.command_center_provider_usage_receipts') is not null
      and to_regprocedure('public.command_center_agency_prepare_side_effect(text,text,text,text,text,text,text,text,text,text,text,text,text[],timestamp with time zone)') is not null
      and to_regprocedure('public.command_center_resource_reserve_quota(text,text,text,text,text,text,text,text,text,text,bigint,bigint,timestamp with time zone,text[],timestamp with time zone)') is not null
      and to_regprocedure('public.command_center_resource_reconcile_usage(uuid,text[],timestamp with time zone)') is not null
    then 1 else 1/0 end;
  "

done

log "ASSERT [cc_a11_prior] replaying idempotent hardening migration remains executable"
apply_file cc_a11_prior "$MIG/20261025020100_category7_resource_quota_usage_reconciliation_hardening.sql"

log "A11.2 PASS: actual PostgreSQL execution succeeded for clean-chain and prior-supported upgrade paths."
