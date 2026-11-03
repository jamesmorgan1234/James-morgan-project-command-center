import type { CommandCenterRuntimeSnapshot, RuntimeProjectRecord, RuntimeProjectSnapshot } from "./snapshot.js";
import { isProjectWorkspaceRuntimeProvider } from "./owner-security-provider.js";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
}
function card(title: string): HTMLElement {
  const node = el("section", "bevel-card project-detail-section project-workspace-card"); node.append(el("h3", "section-title", title)); return node;
}
function field(form: HTMLElement, label: string, multiline = false): HTMLInputElement | HTMLTextAreaElement {
  const wrap = el("label", "project-filter-field"); wrap.append(el("span", "project-filter-label", label));
  const input = multiline ? el("textarea", "cc-input") : el("input", "cc-input");
  input.setAttribute("aria-label", label); input.required = true; if (input instanceof HTMLTextAreaElement) { input.rows = 3; input.maxLength = 12000; }
  else { input.type = "text"; input.maxLength = 500; }
  wrap.append(input); form.append(wrap); return input;
}
function safeLink(ref: string, release: string): string | undefined {
  if (ref.startsWith("roadmap/") && !ref.split("/").some(part => part === "..") && /^[a-zA-Z0-9_./-]+$/.test(ref)) return `https://github.com/jamesmorgan1234/James-morgan-project-command-center/blob/${/^[a-f0-9]{40}$/.test(release) ? release : "build/spec-lock-v2-clean-room"}/${ref}`;
  try { const url = new URL(ref); if (url.protocol === "https:" && !url.username && !url.password && ![...url.searchParams.keys()].some(key => /token|secret|password|api.?key/i.test(key))) return url.href; } catch {}
  return undefined;
}
function link(label: string, href: string): HTMLAnchorElement {
  const node = el("a", "cc-button cc-button--secondary", label); node.href = href; node.target = "_blank"; node.rel = "noopener noreferrer"; return node;
}
function recordList(node: HTMLElement, records: readonly RuntimeProjectRecord[], available: boolean, empty: string, release: string): void {
  if (!available) { node.append(el("p", "muted", "These project records could not be loaded. Refresh before making changes.")); return; }
  if (!records.length) node.append(el("p", "muted", empty));
  for (const record of records) {
    const row = el("article", "project-workspace-record"); row.append(el("strong", undefined, record.title));
    if (record.detail) row.append(el("p", "muted", record.detail));
    if (record.state) row.append(el("span", "muted", record.state.replaceAll("_", " ")));
    if (record.observedAt) row.append(el("span", "muted", `Recorded ${record.observedAt.slice(0, 10)}`));
    const href = record.sourceRef ? safeLink(record.sourceRef, release) : undefined;
    if (href) row.append(link("Open reference", href)); node.append(row);
  }
}
export function renderProjectRecordSection(project: RuntimeProjectSnapshot, kind: "assets" | "decisions" | "integrations", provider: unknown, rerender: () => Promise<void>, release: string): HTMLElement {
  const title = { assets: "Assets", decisions: "Decisions", integrations: "Integrations" }[kind];
  const node = card(title); node.dataset.sectionKey = `project-section:${kind}`; node.classList.add("core-project-section");
  const workspace = project.workspace;
  const available = !!workspace && workspace.sourceAvailability.records === "available" && (kind === "decisions" || workspace.sourceAvailability[kind] === "available");
  recordList(node, workspace?.[kind] ?? [], available, kind === "integrations" ? "No account connections or setup requests are saved for this project yet." : `No ${kind} have been saved for this project yet.`, release);
  if (kind === "integrations") node.append(el("p", "muted", "A setup request is not an authenticated connection. No account, credential, or permission is copied from another project."));
  const details = el("details", "project-record-editor"); details.append(el("summary", "cc-button cc-button--secondary", kind === "assets" ? "Add reference" : kind === "decisions" ? "Record decision" : "Set up integration"));
  const form = el("form", "project-record-form"); const requestId = crypto.randomUUID();
  const name = field(form, kind === "integrations" ? "Provider name" : "Title"); const body = field(form, kind === "integrations" ? "Account purpose and access needed (no credentials)" : "Details", true);
  const url = kind !== "decisions" ? field(form, "Reference URL (HTTPS, no secrets)") : undefined; if (url) url.required = false;
  const submit = el("button", "cc-button", kind === "integrations" ? "Save setup request" : "Save record"); submit.type = "submit";
  const status = el("p", "muted"); status.setAttribute("role", "status"); const writable = isProjectWorkspaceRuntimeProvider(provider) && available;
  submit.disabled = !writable; form.append(submit, status); details.append(form); node.append(details);
  if (writable) form.addEventListener("submit", event => { event.preventDefault(); void (async () => {
    submit.disabled = true; status.textContent = "Saving…";
    try { await provider.saveProjectRecord(project.id, kind === "assets" ? "asset_reference" : kind === "decisions" ? "decision" : "integration_request", name.value, body.value, url?.value, requestId); await rerender(); }
    catch (reason) { status.textContent = reason instanceof Error ? reason.message : "Record could not be saved"; submit.disabled = false; }
  })(); });
  return node;
}
export function renderProjectAgencyControls(project: RuntimeProjectSnapshot, snapshot: CommandCenterRuntimeSnapshot, provider: unknown, rerender: () => Promise<void>): HTMLElement {
  const node = card("Start project / Agency setup"); node.classList.add("project-start-controls");
  const release = snapshot.release.releaseId.state === "known" ? snapshot.release.releaseId.value : "";
  const plan = project.workspace?.sourceRef ? safeLink(project.workspace.sourceRef, release) : undefined;
  if (plan) node.append(link("Open full business plan", plan));
  const blockers = project.workspace?.startBlockers ?? ["Execution readiness has not been loaded."];
  node.append(el("p", "muted", "Prepare a saved Agency run for this project. A draft does not launch a company, enable paid services, or bypass project approval."));
  if (blockers.length) {
    node.append(el("strong", undefined, "Required before unattended execution")); const list = el("ul", "project-start-blockers"); for (const reason of blockers) list.append(el("li", undefined, reason)); node.append(list);
  }
  const form = el("form", "project-record-form"); const objective = field(form, "Agency objective", true); objective.maxLength = 4000; objective.value = `Prepare ${project.name} from its approved business plan. Preserve project isolation and the $0 limit.`;
  const requestId = crypto.randomUUID(); const submit = el("button", "cc-button", "Prepare Agency run"); submit.type = "submit"; const status = el("p", "muted"); status.setAttribute("role", "status");
  submit.disabled = !isProjectWorkspaceRuntimeProvider(provider); form.append(submit, status); node.append(form);
  if (isProjectWorkspaceRuntimeProvider(provider)) form.addEventListener("submit", event => { event.preventDefault(); void (async () => {
    submit.disabled = true; status.textContent = "Preparing a draft run…";
    try { await provider.createProjectAgencyRun(project.id, objective.value, requestId); await rerender(); }
    catch (reason) { status.textContent = reason instanceof Error ? reason.message : "Run could not be prepared"; submit.disabled = false; }
  })(); });
  const runs = snapshot.agency?.runs.filter(run => run.projectId === project.id) ?? [];
  for (const run of runs) {
    const row = el("article", "project-workspace-record"); row.append(el("strong", undefined, run.objective), el("p", "muted", `Run state: ${run.state}. ${run.state === "draft" ? "Saved, awaiting execution setup; no worker has started." : ""}`));
    if (!["stopped", "failed", "completed"].includes(run.state) && isProjectWorkspaceRuntimeProvider(provider)) {
      const stop = el("button", "cc-button cc-button--secondary", "Stop this run"); stop.type = "button";
      stop.addEventListener("click", () => { stop.disabled = true; void provider.stopProjectAgencyRun(project.id, run.runId, run.generation).then(rerender).catch(reason => { status.textContent = reason instanceof Error ? reason.message : "Run could not be stopped"; stop.disabled = false; }); }); row.append(stop);
    }
    node.append(row);
  }
  return node;
}
