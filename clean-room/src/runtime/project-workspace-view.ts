import type { CommandCenterRuntimeSnapshot, RuntimeProjectRecord, RuntimeProjectSnapshot } from "./snapshot.js";
import { isProjectWorkspaceRuntimeProvider } from "./owner-security-provider.js";
import { preparedCompanyId } from "./company-build-start.js";

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
export function safeProjectReferenceLink(ref: string, release: string): string | undefined {
  const [path, fragment, ...extra] = ref.split("#");
  if (path?.startsWith("roadmap/") && !path.split("/").some(part => part === "..") && /^[a-zA-Z0-9_./-]+$/.test(path) && extra.length === 0 && (fragment === undefined || /^sha256=[a-f0-9]{64}$/.test(fragment))) return `https://github.com/jamesmorgan1234/James-morgan-project-command-center/blob/${/^[a-f0-9]{40}$/.test(release) ? release : "build/spec-lock-v2-clean-room"}/${path}`;
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
    const href = record.sourceRef ? safeProjectReferenceLink(record.sourceRef, release) : undefined;
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
  const node = card("Start project"); node.classList.add("project-start-controls");
  const release = snapshot.release.releaseId.state === "known" ? snapshot.release.releaseId.value : "";
  const plan = project.workspace?.sourceRef ? safeProjectReferenceLink(project.workspace.sourceRef, release) : undefined;
  if (plan) node.append(link("Open full business plan", plan));
  // The packet is read through the existing authenticated owner session.
  // Do not enable this UI for Company #014 or any non-company project.
  if (preparedCompanyId(project.id) && isProjectWorkspaceRuntimeProvider(provider) && provider.readCompanyBuildStart) {
    const read = el("button", "cc-button cc-button--secondary", "Read verified build-start instructions");
    read.type = "button";
    const readStatus = el("p", "muted");
    readStatus.setAttribute("role", "status");
    const display = el("article", "project-workspace-record");
    display.hidden = true;
    display.style.whiteSpace = "pre-wrap";
    read.addEventListener("click", () => { void (async () => {
      read.disabled = true;
      readStatus.textContent = "Checking the saved company packet…";
      try {
        const packet = await provider.readCompanyBuildStart!(project.id);
        // textContent, not HTML: never render untrusted instructions as markup.
        display.textContent = packet.instructions;
        display.hidden = false;
        readStatus.textContent = `Verified source and reconciliation records. Roadmap version ${packet.roadmapVersion}; first task ${packet.firstWorkUnitId}. This does not start a company build.`;
      } catch (reason) {
        display.hidden = true;
        readStatus.textContent = reason instanceof Error ? reason.message : "Build-start instructions are unavailable";
      } finally {
        read.disabled = false;
      }
    })(); });
    node.append(read, readStatus, display);
  }
  const blockers = project.workspace?.startBlockers ?? ["Execution readiness has not been loaded."];
  node.append(el("p", "muted", "Start normal-chat work for this project. The worker saves its progress and stops when it needs you or Work. Paid services and protected actions require separate authorization."));
  if (blockers.length) {
    node.append(el("strong", undefined, "Required before unattended execution")); const list = el("ul", "project-start-blockers"); for (const reason of blockers) list.append(el("li", undefined, reason)); node.append(list);
  }
  const runs = snapshot.agency?.runs.filter(run => run.projectId === project.id) ?? [];
  const activeRun = runs.some(run => ["queued", "working", "paused", "blocked", "needs_user"].includes(run.state));
  const form = el("form", "project-record-form"); const objective = field(form, "Agency objective", true); objective.maxLength = 4000; objective.value = `Build ${project.name} through all safe normal-chat work in its approved roadmap. Produce and verify actual artifacts, preserve project isolation and the $0 limit, and stop when Work or owner action is genuinely required.`;
  const requestId = crypto.randomUUID(); const submit = el("button", "cc-button", "Start project"); submit.type = "submit"; const status = el("p", "muted"); status.setAttribute("role", "status");
  submit.disabled = !isProjectWorkspaceRuntimeProvider(provider) || activeRun; form.append(submit, status); node.append(form);
  if (activeRun) status.textContent = "This project already has an active run. Its progress is shown below.";
  if (isProjectWorkspaceRuntimeProvider(provider)) form.addEventListener("submit", event => { event.preventDefault(); void (async () => {
    submit.disabled = true; status.textContent = "Submitting normal-chat work…";
    try { await provider.createProjectAgencyRun(project.id, objective.value, requestId); await rerender(); }
    catch (reason) { status.textContent = reason instanceof Error ? reason.message : "Execution could not be confirmed"; submit.disabled = false; }
  })(); });
  for (const run of runs) {
    const row = el("article", "project-workspace-record"); row.append(el("strong", undefined, run.objective), el("p", "muted", `Run state: ${run.state}. ${run.state === "queued" ? "Waiting for the connected ChatGPT worker; execution has not yet been claimed." : run.state === "draft" ? "Saved, awaiting execution setup; no worker has started." : ""}`));
    if (run.blocker) row.append(el("p", "muted", run.blocker));
    if (["needs_user", "blocked"].includes(run.state) && isProjectWorkspaceRuntimeProvider(provider) && provider.continueProjectAgencyRun) {
      const resume = el("button", "cc-button", "Continue normal-chat work"); resume.type = "button";
      resume.addEventListener("click", () => { resume.disabled = true; void provider.continueProjectAgencyRun!(project.id, run.runId, run.generation).then(rerender).catch(reason => { status.textContent = reason instanceof Error ? reason.message : "Run could not be continued"; resume.disabled = false; }); }); row.append(resume);
    }
    if (!["stopped", "failed", "completed"].includes(run.state) && isProjectWorkspaceRuntimeProvider(provider)) {
      const stop = el("button", "cc-button cc-button--secondary", "Stop this run"); stop.type = "button";
      stop.addEventListener("click", () => { stop.disabled = true; void provider.stopProjectAgencyRun(project.id, run.runId, run.generation).then(rerender).catch(reason => { status.textContent = reason instanceof Error ? reason.message : "Run could not be stopped"; stop.disabled = false; }); }); row.append(stop);
    }
    node.append(row);
  }
  return node;
}
