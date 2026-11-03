-- Register checkpoint reconciliation for the existing portfolio, never a replacement full-build roadmap.
-- No existing roadmap, work unit, checkpoint, progress, profile status, Brain, or access policy is overwritten.
-- Structural validity here means these evidence-review steps form a valid DAG; it does not certify a complete project scope or a connected AI worker.
do $reconcile$
declare p record; refs text[]; next_title text; source text; first_id text;
begin
 for p in select * from public.command_center_project_profiles
 where project_id = any(array['aro','blog-series','command-center','coupon-autopilot','crestven','crowdskein','documentary-series','edge-finder','fanvue-veyla','james-morgan-home-renovation','kdp','kdp-a-calmer-mind','kdp-a-stronger-you','kdp-alpha-mindset','kdp-broken-but-still-here','kdp-daily-progress-planner','kdp-drowned-crown','kdp-garage-door-business-blueprint','kdp-glasswing-pier','kdp-melted-cosmos','kdp-missing-hour','kdp-moving-forward-anyway','kdp-pieces-i-never-got-back','kdp-repeat-button','kdp-simple-budgeting-workbook','kdp-standalones','kdp-take-control-of-your-money','kdp-unfired-world','kdp-weight-between-tasks','kdp-workbooks','loopwren','margincrafttools','mini-movies','morgancommerce','morgans-garage-doors','revocapture','torevi','velo-clip','wealth']) loop
  if exists(select 1 from public.command_center_project_roadmaps where owner_id=p.owner_id and project_id=p.project_id)
    or exists(select 1 from public.command_center_project_work_units where owner_id=p.owner_id and project_id=p.project_id) then continue; end if;
  source := 'supabase:command_center_project_profiles:'||p.project_id;
  refs := array[source,'owner-request:e99cc84d-e4fb-4e7a-9fba-67eeebe1dc69'] || coalesce(p.status_source_refs,'{}'::text[]);
  if p.project_id='loopwren' then refs:=refs||array['library:libfile_e85485de9a108191b09578442024ab10#sha256=3ea384cf2fa5ae7fc9219544fc472b27e9d2650c0428e8c053a30be3cb24b6de','library:libfile_fee6323a5a6c81919e929f88a03f344d#sha256=18105c04d633b63fa99198adb5a344681f248ce2e9b67831299e74c3a430a71d']; end if;
  if p.project_id='crowdskein' then refs:=refs||array['library:libfile_44704f4b55108191be13b0fffbd960ee#sha256=954ec74a0e5cfe773129dc785dbb9506be7328c5b05a5d2ef9298f0015d20f07','library:libfile_6eb76104e1108191986ead3884e03b28#sha256=730fec1757f48e54f15b45bf708ab404db8eb98d3dd4710cc2f24f0221ad4ba8']; end if;
  first_id := p.project_id||':01-reconcile-existing-roadmap';
  next_title := coalesce(nullif(p.next_action,''),'Recover the exact saved next step for '||p.name||' before execution');
  if p.project_id='command-center' then next_title := 'Verify the current authorized branch and live application against the outstanding owner-requested fixes; preserve completed phases'; end if;
  insert into public.command_center_project_roadmaps(owner_id,project_id,version,state,source_ref,structure_verified,denominator_trusted,denominator_evidence_refs)
    values(p.owner_id,p.project_id,1,'current',source,false,false,'{}');
  insert into public.command_center_project_work_units(owner_id,project_id,roadmap_version,work_unit_id,category_id,phase_id,title,status,applicable,dependency_ids,gate_ids,acceptance_criteria,evidence_refs)
    values(p.owner_id,p.project_id,1,first_id,'existing-project','readiness','Reconcile '||p.name||'''s existing roadmap and Brain evidence','planned',true,'{}','{}',
      array['Read the existing project roadmap, checkpoint and Brain specification from the attached project-scoped sources. Preserve completed work; do not rebuild or reset the project.',
      'Reconcile the exact first incomplete step, dependencies, acceptance criteria and dated evidence with current source bytes. Record missing evidence explicitly instead of treating it as zero completion.',
      'Verify Brain specification/configuration separately from a registered inference provider or execution worker. Do not claim a connected worker from the presence of a plan or Brain document.',
      'Register the recovered full roadmap and its evidence using the existing roadmap authoring and verification controls before changing the completion denominator.',
      'Retain $0, project isolation, protected assets, publication/legal holds and owner-only boundaries. Readiness review does not authorize external execution.'],refs),
    (p.owner_id,p.project_id,1,p.project_id||':02-resume-existing-checkpoint','existing-project','resume',next_title,'planned',true,array[first_id],'{}',
      array['Resume only from the verified existing checkpoint after reconciliation; never restart completed phases.',
      'Verify prerequisites and any source-recorded blocker. Require the actual authorized free execution resource and all action-specific owner permissions before execution.',
      'Attach result evidence and preserve the original project scope and approved assets.'],refs);
  perform command_center_private.c5_assert_roadmap_integrity(p.owner_id,p.project_id,1);
  update public.command_center_project_roadmaps set structure_verified=true where owner_id=p.owner_id and project_id=p.project_id and version=1;
 end loop;
end $reconcile$;
