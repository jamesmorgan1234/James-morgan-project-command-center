-- Branch only. Preserve drafts, extend declarations without silently granting publish readiness.
alter table public.command_center_social_draft_revision_history add column company_id text,add column project_id text,add column platform text,add column variant_of_draft_id text,add column disclosures text[] not null default '{}';
create function public.command_center_guard_social_draft_lineage() returns trigger language plpgsql security definer set search_path='' as $$
declare prior public.command_center_social_draft_revision_history;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text,103));
 if not exists(select 1 from public.command_center_social_identity_map_history where owner_id=new.owner_id and account_identity_id=new.intended_account_id and brand_id=new.brand_id and company_id is not distinct from new.company_id and project_id is not distinct from new.project_id and platform=new.platform) then raise exception 'Draft intended canonical company/project/platform/account mismatch'; end if;
 select * into prior from public.command_center_social_draft_revision_history where owner_id=new.owner_id and draft_id=new.draft_id order by draft_version desc limit 1;
 if found and (prior.brand_id<>new.brand_id or prior.company_id is distinct from new.company_id or prior.project_id is distinct from new.project_id or new.draft_version<>prior.draft_version+1 or new.observed_at<prior.observed_at) then raise exception 'Draft lineage/version/time mismatch'; end if;
 if exists(select 1 from unnest(new.source_asset_refs||new.rights_evidence_refs||new.provenance_refs||new.approval_refs||new.disclosures) r where nullif(btrim(r),'') is null) then raise exception 'Draft references cannot be blank'; end if;
 return new;
end $$;
revoke all on function public.command_center_guard_social_draft_lineage() from public,anon,authenticated;
create trigger social_draft_lineage_guard before insert on public.command_center_social_draft_revision_history for each row execute function public.command_center_guard_social_draft_lineage();
