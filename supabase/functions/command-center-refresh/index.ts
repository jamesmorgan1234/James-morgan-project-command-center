import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const nowIso = () => new Date().toISOString();
const rolePriority = (role: string) => ["master","book_primary","books_portfolio","work","books_work"].indexOf(role) >= 0
  ? ["master","book_primary","books_portfolio","work","books_work"].indexOf(role)
  : 99;

function methodForCheckpoint(cp: any, source: any) {
  if (cp?.recovery_method) return cp.recovery_method;
  if (cp?.checkpoint_kind === "handoff" || cp?.checkpoint_kind === "work_result") return "handoff";
  if (cp?.checkpoint_kind === "no_newer_work") return "master_no_newer_work";
  if (["master","book_primary","books_portfolio"].includes(source?.source_role)) return "content_status_block";
  return "exact";
}

function cleanProjectPatch(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const src = value as Record<string, unknown>;
  const allowed = ["status","verification","stage","next_action","blocker","attention","last_verified","source_status"];
  const out: Record<string, unknown> = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = src[key];
  return out;
}

async function runAudit(admin: any, ownerId: string, requestId: string) {
  try {
    const { data: sources, error: sourceError } = await admin
      .from("project_sources")
      .select("id,owner_id,project_id,source_role,chat_title,precedence,required,active")
      .eq("owner_id", ownerId)
      .eq("active", true)
      .order("project_id")
      .order("precedence");
    if (sourceError) throw sourceError;

    const { data: projects, error: projectError } = await admin
      .from("projects")
      .select("id,name,sort_order")
      .eq("owner_id", ownerId)
      .order("sort_order")
      .order("name");
    if (projectError) throw projectError;

    const sourceIds = (sources || []).map((s: any) => s.id);
    let checkpoints: any[] = [];
    if (sourceIds.length) {
      const { data, error } = await admin
        .from("source_checkpoints")
        .select("id,owner_id,project_id,source_id,source_role,source_chat_title,checkpoint_kind,recovery_method,recovered_title,observed_at,captured_at,verified,summary,state_json,evidence")
        .eq("owner_id", ownerId)
        .in("source_id", sourceIds)
        .order("observed_at", { ascending: false })
        .order("captured_at", { ascending: false });
      if (error) throw error;
      checkpoints = data || [];
    }

    const latestBySource = new Map<string, any>();
    for (const cp of checkpoints) if (!latestBySource.has(cp.source_id)) latestBySource.set(cp.source_id, cp);
    const sourcesByProject = new Map<string, any[]>();
    for (const source of sources || []) {
      const arr = sourcesByProject.get(source.project_id) || [];
      arr.push(source);
      sourcesByProject.set(source.project_id, arr);
    }

    const projectList = (projects || []).filter((p: any) => sourcesByProject.has(p.id));
    const total = projectList.length;
    await admin.from("refresh_requests").update({
      projects_total: total,
      projects_checked: 0,
      summary: "Live cloud audit started. Reading persisted canonical Master/Work checkpoints.",
      updated_at: nowIso(),
    }).eq("id", requestId).eq("owner_id", ownerId);

    const snapshotSources: any[] = [];
    const gaps: string[] = [];
    const authoritative: any[] = [];
    let checked = 0;

    for (const project of projectList) {
      const projectSources = sourcesByProject.get(project.id) || [];
      const verifiedCandidates: any[] = [];

      for (const source of projectSources) {
        const cp = latestBySource.get(source.id) || null;
        const reconciled = Boolean(cp?.verified);
        const method = reconciled ? methodForCheckpoint(cp, source) : "missing";
        const gap = !reconciled && source.required
          ? `${project.name}: required source ${source.chat_title} has no verified persisted checkpoint.`
          : null;
        if (gap) gaps.push(gap);

        snapshotSources.push({
          project_id: project.id,
          source_role: source.source_role,
          requested_title: source.chat_title,
          recovered_title: cp?.recovered_title || cp?.source_chat_title || null,
          method,
          gap,
          checkpoint_kind: cp?.checkpoint_kind || null,
          checkpoint_observed_at: cp?.observed_at || null,
        });

        await admin.from("project_sources").update({
          last_recovery_status: reconciled ? "reconciled" : (source.required ? "missing" : "optional_missing"),
          last_recovery_method: method,
          last_recovered_title: cp?.recovered_title || cp?.source_chat_title || null,
          last_recovered_at: nowIso(),
          last_gap: gap,
          last_refresh_request_id: requestId,
          last_recovery_origin: "cloud_checkpoint_audit",
          updated_at: nowIso(),
        }).eq("id", source.id).eq("owner_id", ownerId);

        if (reconciled) verifiedCandidates.push({ cp, source });
      }

      verifiedCandidates.sort((a, b) => {
        const ta = new Date(a.cp.observed_at).getTime();
        const tb = new Date(b.cp.observed_at).getTime();
        if (tb !== ta) return tb - ta;
        const pa = Number(a.source.precedence ?? rolePriority(a.source.source_role));
        const pb = Number(b.source.precedence ?? rolePriority(b.source.source_role));
        return pa - pb;
      });

      const winner = verifiedCandidates[0] || null;
      if (winner) {
        const patch = cleanProjectPatch(winner.cp?.state_json?.project_patch);
        authoritative.push({
          project_id: project.id,
          source_role: winner.source.source_role,
          source_title: winner.source.chat_title,
          checkpoint_kind: winner.cp.checkpoint_kind,
          checkpoint_observed_at: winner.cp.observed_at,
        });
        if (Object.keys(patch).length) {
          await admin.from("projects").update({ ...patch, updated_at: nowIso() }).eq("id", project.id).eq("owner_id", ownerId);
        }
      }

      checked += 1;
      const interimSnapshot = { result: "processing", sources: snapshotSources, gaps, authoritative };
      await admin.from("refresh_requests").update({
        projects_checked: checked,
        summary: `Auditing ${project.name} • ${checked} of ${total} projects reconciled.`,
        source_snapshot: interimSnapshot,
        updated_at: nowIso(),
      }).eq("id", requestId).eq("owner_id", ownerId);
    }

    const requiredTotal = (sources || []).filter((s: any) => s.required).length;
    const requiredReconciled = snapshotSources.filter((s: any) => !s.gap && (sources || []).find((x: any) => x.project_id === s.project_id && x.source_role === s.source_role && x.chat_title === s.requested_title)?.required).length;
    const optionalMissing = snapshotSources.filter((s: any) => s.method === "missing" && !(sources || []).find((x: any) => x.project_id === s.project_id && x.source_role === s.source_role && x.chat_title === s.requested_title)?.required).length;
    const status = gaps.length ? "partial" : "completed";
    const finalSummary = gaps.length
      ? `Live audit checked all ${total} tracked projects. ${requiredReconciled} of ${requiredTotal} required persisted canonical checkpoints reconciled; ${gaps.length} required source gap${gaps.length === 1 ? "" : "s"} remain. Existing verified project state was preserved where a newer verified checkpoint was unavailable.`
      : `Live audit checked all ${total} tracked projects and reconciled all ${requiredTotal} required persisted canonical checkpoints. ${optionalMissing} optional source gap${optionalMissing === 1 ? "" : "s"} remain nonblocking.`;

    await admin.from("refresh_requests").update({
      status,
      projects_checked: total,
      completed_at: nowIso(),
      summary: finalSummary,
      error: null,
      source_snapshot: { result: status, sources: snapshotSources, gaps, authoritative },
      updated_at: nowIso(),
    }).eq("id", requestId).eq("owner_id", ownerId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.from("refresh_requests").update({
      status: "failed",
      completed_at: nowIso(),
      error: message,
      summary: "The live cloud audit worker failed. Existing verified project state was preserved.",
      updated_at: nowIso(),
    }).eq("id", requestId).eq("owner_id", ownerId);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: member } = await admin.from("command_center_members").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!member) return json({ error: "Forbidden" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const requestId = String(body?.request_id || "").trim();
  if (!requestId) return json({ error: "request_id is required" }, 400);

  const { data: requestRow, error: requestError } = await admin
    .from("refresh_requests")
    .select("id,owner_id,status,started_at,requested_at")
    .eq("id", requestId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (requestError || !requestRow) return json({ error: "Refresh request not found" }, 404);
  if (["completed","partial","failed"].includes(requestRow.status)) return json({ ok: true, status: requestRow.status, already_terminal: true });

  const startedMs = requestRow.started_at ? new Date(requestRow.started_at).getTime() : 0;
  const staleProcessing = requestRow.status === "processing" && startedMs && (Date.now() - startedMs > 2 * 60 * 1000);
  if (requestRow.status === "processing" && !staleProcessing) return json({ ok: true, status: "processing", already_running: true });

  const claimTime = nowIso();
  const { data: claimed, error: claimError } = await admin.from("refresh_requests").update({
    status: "processing",
    started_at: claimTime,
    completed_at: null,
    error: null,
    summary: staleProcessing ? "Restarting a stale live audit worker." : "Live cloud audit worker started.",
    updated_at: claimTime,
  }).eq("id", requestId).eq("owner_id", user.id).in("status", staleProcessing ? ["processing"] : ["pending"]).select("id").maybeSingle();
  if (claimError) return json({ error: claimError.message }, 500);
  if (!claimed) return json({ ok: true, status: "processing", already_running: true });

  const task = runAudit(admin, user.id, requestId);
  const edgeRuntime = (globalThis as any).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(task);
    return json({ ok: true, status: "processing", request_id: requestId }, 202);
  }
  await task;
  return json({ ok: true, status: "finished", request_id: requestId });
});
