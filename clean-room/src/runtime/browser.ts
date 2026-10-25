import { createCoreRouteRegistry, type ResolvedRoute } from "../ui/routes.js";
import { ApplicationShell, type ShellState } from "../ui/shell.js";
import { createHomeGrid } from "../ui/home.js";
import type { TruthValue } from "../data/canonical.js";
import { providerFromDocument, type RuntimeSnapshotProvider } from "./provider.js";
import type { CommandCenterRuntimeSnapshot, RuntimeProjectSnapshot, RuntimeSurfaceSnapshot } from "./snapshot.js";
import { BrowserPwaUpdateClient, type PwaUpdateView } from "./pwa-client.js";
import { resolveBrowserRoute, type BrowserRouteResolution } from "./route-state.js";
import { filterRuntimeProjects, groupRuntimeProjects, projectFacetValues, projectFilterFromSearch, type RuntimeProjectFilter } from "./project-screen.js";
import { renderBrainView } from "./brain-view.js";

const ROUTES = createCoreRouteRegistry();
const APP_SHELL = new ApplicationShell();
const PRIMARY_NAV_ROUTE_KEYS = Object.freeze(["route:home", "route:projects", "route:active-live", "route:next-up"] as const);
const LIVE_EXECUTION_STALE_AFTER_MS = 120_000;
const CORE_PROJECT_DETAIL_SECTION_KEYS = new Set([
  "project-section:snapshot",
  "project-section:owner-inputs",
  "project-section:history",
  "project-section:roadmap",
  "project-section:assets",
  "project-section:decisions",
  "project-section:integrations",
  "project-section:brain",
  "project-section:agency",
  "project-section:analytics",
  "project-section:conversation"
]);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function truthText<T>(truth: TruthValue<T>, format: (value: T) => string = (value) => String(value)): string {
  if (truth.state === "known") return format(truth.value);
  if (truth.state === "not_applicable") return "N/A";
  return "N/A";
}
function availabilityClass(value: string): string { return `status status--${value.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`; }
function navigate(path: string): void {
  if (window.location.pathname === path && !window.location.search) return;
  window.history.pushState({}, "", path);
  void renderApplication();
}
function updateProjectQuery(updates: Readonly<Record<string, string | undefined>>): void {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value?.trim()) url.searchParams.set(key, value.trim());
    else url.searchParams.delete(key);
  }
  window.history.pushState({}, "", `${url.pathname}${url.search}`);
  void renderApplication();
}
function routeLink(label: string, path: string, className = "nav-link"): HTMLAnchorElement {
  const anchor = el("a", className, label);
  anchor.href = path;
  anchor.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(path);
  });
  return anchor;
}
function syncShell(snapshot: CommandCenterRuntimeSnapshot): void {
  if (APP_SHELL.state === "cold") { APP_SHELL.transition("starting"); APP_SHELL.transition("hydrating"); }
  const target: ShellState = snapshot.connection.state === "connected" ? "ready" : snapshot.connection.state === "disconnected" ? "offline_ready" : "degraded";
  if (APP_SHELL.state !== target) APP_SHELL.transition(target);
}
function headerSubtitle(route: ResolvedRoute): string {
  switch (route.route.key) {
    case "route:projects": return "Full portfolio of tracked projects";
    case "route:active-live": return "Live projects in progress";
    case "route:next-up": return "Priority queue";
    case "route:project-detail": return "Project Details";
    case "route:brain": return "Persistent intelligence workspace";
    default: return "Private owner command system";
  }
}
function statusLabel(project: RuntimeProjectSnapshot): string { return project.lifecycle.state === "known" ? project.lifecycle.value.replaceAll("_", " ") : truthText(project.status); }
function projectHref(project: RuntimeProjectSnapshot): string { return `/project/${encodeURIComponent(project.id)}`; }
function projectContextHref(surface: "brain" | "agency" | "analytics", projectId: string, mode?: string): string {
  const params = new URLSearchParams({ project: projectId });
  if (mode) params.set("mode", mode);
  return `/${surface}?${params.toString()}`;
}
function renderConnection(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const strip = el("section", "connection-strip");
  strip.append(
    el("strong", availabilityClass(snapshot.connection.state), snapshot.connection.state.toUpperCase()),
    el("span", "connection-message", snapshot.connection.message),
    el("span", "connection-sync", `Last sync: ${truthText(snapshot.connection.lastSuccessfulSyncAt)}`)
  );
  return strip;
}
function bevelCard(className = ""): HTMLElement { return el("article", `bevel-card ${className}`.trim()); }
function bevelRouteCard(path: string, className: string, accessibleLabel: string): HTMLAnchorElement {
  const card = routeLink("", path, `bevel-card ${className}`.trim());
  card.setAttribute("aria-label", accessibleLabel);
  return card;
}
function statusPill(label: string, status: string): HTMLElement {
  const pill = el("span", availabilityClass(status), label);
  pill.prepend(el("span", "status__dot"));
  return pill;
}
function projectIcon(): HTMLElement { const icon = el("div", "project-icon"); icon.setAttribute("aria-hidden", "true"); return icon; }
function artPanel(): HTMLElement { const art = el("div", "project-art"); art.setAttribute("aria-hidden", "true"); return art; }
function progressRing(project: RuntimeProjectSnapshot): HTMLElement {
  const wrap = el("div", "progress-wrap");
  const ring = el("div", "progress-ring");
  if (project.progressPercent.state === "known") {
    ring.style.setProperty("--progress", `${Math.max(0, Math.min(100, project.progressPercent.value))}%`);
    ring.append(el("strong", undefined, `${project.progressPercent.value}%`));
  } else {
    ring.classList.add("progress-ring--unknown");
    ring.append(el("strong", undefined, "N/A"));
  }
  wrap.append(ring, el("span", "metric-label", "Scope"));
  return wrap;
}
function projectTitle(project: RuntimeProjectSnapshot): HTMLSpanElement { return el("span", "project-title", project.name); }
function emptyState(title: string, body: string, status: string): HTMLElement {
  const card = bevelCard("empty-state");
  card.append(el("h2", "section-title", title), el("p", "muted", body), statusPill(status.toUpperCase(), status));
  return card;
}

function renderPortfolioSummary(snapshot: CommandCenterRuntimeSnapshot, displayedCount = snapshot.projects.length): HTMLElement {
  const card = bevelCard("portfolio-summary");
  card.append(projectIcon());
  const count = el("div", "portfolio-count");
  count.append(el("strong", undefined, String(snapshot.projects.length)), el("span", undefined, "TOTAL PROJECTS"));
  const summary = displayedCount === snapshot.projects.length ? "Canonical project profiles loaded" : `${displayedCount} shown · ${snapshot.projects.length} canonical total`;
  card.append(count, el("div", "portfolio-breakdown", summary), artPanel());
  return card;
}
function runtimeTruthValue(value: RuntimeProjectSnapshot["typeKey"]): string { return value?.state === "known" ? value.value : "N/A"; }
function renderProjectRow(project: RuntimeProjectSnapshot): HTMLElement {
  const row = bevelRouteCard(projectHref(project), "project-row project-navigation-card", `Open ${project.name}`);
  const text = el("div", "project-row__text");
  const metadata = el("div", "project-meta");
  metadata.append(
    el("span", "project-meta__item", `Type: ${runtimeTruthValue(project.typeKey)}`),
    el("span", "project-meta__item", `Company: ${runtimeTruthValue(project.companyId)}`),
    el("span", "project-meta__item", `Priority: ${truthText(project.priority)}`)
  );
  text.append(projectTitle(project), el("p", "project-subtitle", truthText(project.mission)), metadata, statusPill(statusLabel(project), project.lifecycle.state === "known" ? project.lifecycle.value : "unavailable"));
  row.append(projectIcon(), text, artPanel(), progressRing(project));
  return row;
}
function projectSelect(labelText: string, queryKey: string, values: readonly string[], current: string | undefined): HTMLLabelElement {
  const label = el("label", "project-filter-field");
  label.append(el("span", "project-filter-label", labelText));
  const select = el("select", "project-filter-control");
  select.setAttribute("aria-label", labelText);
  const all = el("option", undefined, `All ${labelText.toLowerCase()}`);
  all.value = "";
  select.append(all);
  for (const value of values) {
    const option = el("option", undefined, value.replace(/^.*?:/, "").replaceAll("_", " "));
    option.value = value;
    option.selected = current === value;
    select.append(option);
  }
  select.addEventListener("change", () => updateProjectQuery({ [queryKey]: select.value || undefined }));
  label.append(select);
  return label;
}
function renderProjectControls(snapshot: CommandCenterRuntimeSnapshot, filter: RuntimeProjectFilter): HTMLElement {
  const toolbar = bevelCard("project-toolbar");
  const search = el("form", "project-search");
  search.setAttribute("role", "search");
  const inputLabel = el("label", "project-filter-field project-filter-field--search");
  inputLabel.append(el("span", "project-filter-label", "Search"));
  const input = el("input", "project-filter-control");
  input.type = "search";
  input.name = "q";
  input.value = filter.query ?? "";
  input.placeholder = "Project name, mission, type, company";
  input.setAttribute("aria-label", "Search projects");
  inputLabel.append(input);
  const submit = el("button", "project-filter-button", "Apply");
  submit.type = "submit";
  search.append(inputLabel, submit);
  search.addEventListener("submit", (event) => { event.preventDefault(); updateProjectQuery({ q: input.value || undefined }); });

  const facets = projectFacetValues(snapshot.projects);
  const filters = el("div", "project-filter-grid");
  filters.append(
    projectSelect("Lifecycle", "lifecycle", facets.lifecycles, filter.lifecycle),
    projectSelect("Priority", "priority", facets.priorities, filter.priority),
    projectSelect("Type", "type", facets.typeKeys, filter.typeKey),
    projectSelect("Company", "company", facets.companyIds, filter.companyId)
  );
  const grouping = projectSelect("Group", "group", ["none", "type", "company", "lifecycle", "priority"], filter.groupBy ?? "none");
  grouping.classList.add("project-filter-field--group");
  const reset = el("button", "project-filter-button project-filter-button--secondary", "Reset");
  reset.type = "button";
  reset.addEventListener("click", () => updateProjectQuery({ q: undefined, lifecycle: undefined, priority: undefined, type: undefined, company: undefined, group: undefined }));
  const footer = el("div", "project-toolbar__footer");
  footer.append(grouping, reset);
  toolbar.append(search, filters, footer);
  return toolbar;
}
function renderProjects(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "screen-stack");
  if (snapshot.connection.state !== "connected" && snapshot.projects.length === 0) {
    section.append(emptyState("Projects unavailable", "No canonical project records are loaded. This is not interpreted as zero projects.", snapshot.connection.state));
    return section;
  }
  const filter = projectFilterFromSearch(window.location.search);
  const filtered = filterRuntimeProjects(snapshot.projects, filter);
  const groups = groupRuntimeProjects(filtered, filter.groupBy ?? "none");
  section.append(renderPortfolioSummary(snapshot, filtered.length), renderProjectControls(snapshot, filter));
  if (filtered.length === 0) {
    section.append(emptyState("No matching projects", "The canonical project registry is loaded, but no project matches the current filters. Reset the filters to show the full portfolio.", "available"));
    return section;
  }
  for (const group of groups) {
    if ((filter.groupBy ?? "none") !== "none") {
      const heading = el("div", "project-group-heading");
      heading.append(el("h2", "section-title", group.label.toUpperCase()), el("span", "project-group-count", String(group.projects.length)));
      section.append(heading);
    }
    for (const project of group.projects) section.append(renderProjectRow(project));
  }
  return section;
}

function activeProjects(snapshot: CommandCenterRuntimeSnapshot): readonly RuntimeProjectSnapshot[] {
  const nowMs = Date.parse(snapshot.generatedAt);
  if (!Number.isFinite(nowMs)) return Object.freeze([]);
  return Object.freeze(snapshot.projects.filter((project) => {
    if (project.lifecycle.state === "known" && ["archived", "superseded", "completed"].includes(project.lifecycle.value)) return false;
    const live = project.liveExecution;
    if (!live || live.state !== "known") return false;
    const heartbeatMs = Date.parse(live.value.lastHeartbeatAt);
    if (!Number.isFinite(heartbeatMs) || heartbeatMs > nowMs || nowMs - heartbeatMs > LIVE_EXECUTION_STALE_AFTER_MS) return false;
    return live.value.status === "working" && live.value.executorClaimed === true && live.value.evidence.length > 0;
  }));
}
function renderActiveRow(project: RuntimeProjectSnapshot): HTMLElement {
  const row = bevelRouteCard(projectHref(project), "active-row project-navigation-card", `Open ${project.name}`);
  const text = el("div", "active-row__text");
  const live = project.liveExecution?.state === "known" ? project.liveExecution.value : undefined;
  const activeTask = live?.currentTaskTitle ?? (project.nextAction.state === "known" ? project.nextAction.value : "Verified executor active");
  text.append(projectTitle(project), statusPill("LIVE", "live"), el("p", "next-action", activeTask));
  const scope = el("div", "scope-column");
  scope.append(
    el("strong", undefined, truthText(project.progressPercent, (value) => `${value}%`)),
    el("span", "metric-label", "Scope"),
    el("span", "sync-note", live ? `Heartbeat ${live.lastHeartbeatAt}` : "Execution evidence unavailable")
  );
  row.append(projectIcon(), text, el("div", "vertical-divider"), scope, artPanel());
  return row;
}
function renderActive(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "screen-stack");
  const projects = activeProjects(snapshot);
  if (projects.length === 0) {
    section.append(emptyState("No verified live projects", "No project has a currently claimed executor with a fresh verified heartbeat in this snapshot. Project lifecycle/status alone is not treated as live execution.", snapshot.connection.state));
    return section;
  }
  for (const project of projects) section.append(renderActiveRow(project));
  return section;
}

function nextProjects(snapshot: CommandCenterRuntimeSnapshot): readonly RuntimeProjectSnapshot[] {
  return Object.freeze([...snapshot.projects]
    .filter((project) => !(project.lifecycle.state === "known" && ["archived", "superseded", "completed"].includes(project.lifecycle.value)))
    .filter((project) => project.nextWorkReadiness?.state === "known" && project.nextWorkReadiness.value.ready && project.nextWorkReadiness.value.evidence.length > 0)
    .sort((a, b) => {
      const aReady = a.nextWorkReadiness?.state === "known" ? a.nextWorkReadiness.value : undefined;
      const bReady = b.nextWorkReadiness?.state === "known" ? b.nextWorkReadiness.value : undefined;
      return (aReady?.priorityRank ?? Number.MAX_SAFE_INTEGER) - (bReady?.priorityRank ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name);
    }));
}
function renderNextRow(project: RuntimeProjectSnapshot): HTMLElement {
  const row = bevelRouteCard(projectHref(project), "next-row project-navigation-card", `Open ${project.name}`);
  const text = el("div", "next-row__text");
  const readiness = project.nextWorkReadiness?.state === "known" ? project.nextWorkReadiness.value : undefined;
  const action = project.nextAction.state === "known" ? project.nextAction.value : readiness?.title ?? "N/A";
  text.append(projectTitle(project), statusPill("READY", "ready"), el("p", "next-action", action));
  row.append(projectIcon(), text, artPanel());
  return row;
}
function renderNextUp(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "screen-stack");
  const projects = nextProjects(snapshot);
  if (projects.length === 0) {
    section.append(emptyState("Priority queue unavailable", "No project currently has verified roadmap readiness with supporting evidence in this snapshot. A next-action string by itself is not enough.", snapshot.connection.state));
    return section;
  }
  for (const project of projects) section.append(renderNextRow(project));
  return section;
}

function appendDynamicProjectDetailSections(section: HTMLElement, project: RuntimeProjectSnapshot): void {
  for (const detail of project.detailSections ?? []) {
    if (CORE_PROJECT_DETAIL_SECTION_KEYS.has(detail.key)) continue;
    const card = bevelCard("project-detail-section dynamic-project-section");
    card.dataset.sectionKey = detail.key;
    const heading = el("div", "card-heading");
    heading.append(el("h3", "section-title", detail.title));
    if (detail.required) heading.append(statusPill("REQUIRED", "candidate"));
    card.append(heading);
    if (detail.content.state === "known") card.append(el("p", "muted", detail.content.value));
    else if (detail.content.state === "not_applicable") card.append(el("p", "muted", "Not applicable for this project."));
    else card.append(el("p", "muted", "No verified content is available for this type-specific section in the current canonical runtime snapshot."));
    if (detail.capabilityKey) card.append(el("p", "project-detail-capability", detail.capabilityKey));
    section.append(card);
  }
}
function coreProjectDetailCard(key: string, title: string, body: string, status?: string, path?: string): HTMLElement {
  const card = path ? genericCard(title, body, status, path) : genericCard(title, body, status);
  card.classList.add("project-detail-section", "core-project-section");
  card.dataset.sectionKey = `project-section:${key}`;
  return card;
}
function renderProjectDetail(snapshot: CommandCenterRuntimeSnapshot, projectId: string): HTMLElement {
  const project = snapshot.projects.find((candidate) => candidate.id === projectId);
  const section = el("section", "screen-stack");
  if (!project) {
    section.append(emptyState("Project unavailable", "This project is not present in the current canonical runtime snapshot.", snapshot.connection.state));
    return section;
  }

  const hero = bevelCard("project-hero project-detail-section core-project-section");
  hero.dataset.sectionKey = "project-section:snapshot";
  const heroText = el("div", "project-hero__text");
  heroText.append(
    el("span", "eyebrow", truthText(project.priority, (value) => `${value} priority`).toUpperCase()),
    el("h2", "project-hero__title", project.name),
    el("p", "project-description", truthText(project.mission)),
    statusPill(statusLabel(project), project.lifecycle.state === "known" ? project.lifecycle.value : "unavailable")
  );
  hero.append(projectIcon(), heroText, artPanel());
  const snapshotMetrics = el("div", "performance-grid");
  const metrics: readonly [string, string][] = [
    ["Progress", truthText(project.progressPercent, (value) => `${value}%`)],
    ["Stage", truthText(project.stage)],
    ["Priority", truthText(project.priority)],
    ["Verification", truthText(project.verification)]
  ];
  for (const [label, value] of metrics) {
    const metric = el("div", "performance-metric");
    metric.append(el("span", "performance-metric__label", label), el("strong", "performance-metric__value", value));
    snapshotMetrics.append(metric);
  }
  hero.append(snapshotMetrics);
  section.append(hero);

  const ownerInputs = bevelCard("project-detail-section core-project-section owner-inputs-section");
  ownerInputs.dataset.sectionKey = "project-section:owner-inputs";
  ownerInputs.append(el("h3", "section-title", "OWNER INPUTS"));
  const ownerFacts = el("dl", "history-facts");
  ownerFacts.append(
    el("dt", undefined, "Needs Me"), el("dd", undefined, truthText(project.needsMeCount)),
    el("dt", undefined, "Blockers"), el("dd", undefined, truthText(project.blockers, (values) => values.length ? values.join(" · ") : "None verified"))
  );
  ownerInputs.append(ownerFacts);
  section.append(ownerInputs);

  const history = bevelCard("project-detail-section core-project-section history-row");
  history.dataset.sectionKey = "project-section:history";
  history.append(el("h3", "section-title", "HISTORY"));
  history.append(el("p", "muted", truthText(project.recentActivity, (values) => values.length ? values.join(" · ") : "No verified recent activity")));
  section.append(history);

  const roadmap = bevelCard("project-detail-section core-project-section roadmap-section");
  roadmap.dataset.sectionKey = "project-section:roadmap";
  roadmap.append(el("h3", "section-title", "ROADMAP"));
  const roadmapFacts = el("dl", "history-facts");
  const readiness = project.nextWorkReadiness?.state === "known" ? project.nextWorkReadiness.value : undefined;
  roadmapFacts.append(
    el("dt", undefined, "Progress"), el("dd", undefined, truthText(project.progressPercent, (value) => `${value}%`)),
    el("dt", undefined, "Checkpoint"), el("dd", undefined, truthText(project.currentCheckpoint)),
    el("dt", undefined, "Next action"), el("dd", undefined, truthText(project.nextAction)),
    el("dt", undefined, "Readiness"), el("dd", undefined, readiness ? (readiness.ready ? "Ready with evidence" : "Not ready") : "N/A")
  );
  roadmap.append(roadmapFacts);
  section.append(roadmap);

  section.append(coreProjectDetailCard("assets", "ASSETS", "No verified project asset summary is available in the current canonical runtime snapshot.", "unavailable"));
  section.append(coreProjectDetailCard("decisions", "DECISIONS", "No verified project decision summary is available in the current canonical runtime snapshot.", "unavailable"));

  const integrations = bevelCard("project-detail-section core-project-section integrations-row");
  integrations.dataset.sectionKey = "project-section:integrations";
  integrations.append(el("h3", "section-title", "INTEGRATIONS"), el("p", "muted", "Integration data unavailable in the current canonical runtime snapshot."), statusPill("UNAVAILABLE", "unavailable"));
  if (project.specialistKey) integrations.append(el("p", "specialist-note", `Specialist extension: ${project.specialistKey}`));
  section.append(integrations);

  const brainHref = projectContextHref("brain", project.id);
  const agencyHref = projectContextHref("agency", project.id);
  const analyticsHref = projectContextHref("analytics", project.id);
  const conversationHref = projectContextHref("brain", project.id, "conversation");
  section.append(
    coreProjectDetailCard("brain", "BRAIN", "Open this project in Brain context. Current Brain availability remains governed by the canonical Brain runtime.", undefined, brainHref),
    coreProjectDetailCard("agency", "AGENCY", `Current project Agency state: ${truthText(project.agencyState)}. Open the project-scoped Agency surface for canonical execution state.`, undefined, agencyHref),
    coreProjectDetailCard("analytics", "ANALYTICS", "Open project-scoped analytics. No metric is inferred when the canonical analytics surface has no current evidence.", undefined, analyticsHref),
    coreProjectDetailCard("conversation", "CONVERSATION", "Open project-scoped Brain conversation context. Conversation availability and history are determined by the canonical Brain runtime.", undefined, conversationHref)
  );

  appendDynamicProjectDetailSections(section, project);
  return section;
}

function genericCard(title: string, body: string, status?: string, path?: string): HTMLElement {
  const node = path ? routeLink("", path, "bevel-card surface-card") : bevelCard("surface-card");
  const heading = el("div", "card-heading");
  heading.append(el("h3", "section-title", title));
  if (status) heading.append(statusPill(status.replaceAll("_", " "), status));
  node.append(heading, el("p", "muted", body));
  return node;
}
function renderHome(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "home-grid");
  const connected = snapshot.connection.state === "connected";
  const active = activeProjects(snapshot);
  const next = nextProjects(snapshot);
  const ownerAttention = snapshot.surfaces.find((candidate) => candidate.key === "needs-me");
  const grid = createHomeGrid([
    {
      key: "projects",
      title: "Projects",
      route: "/projects",
      verifiedCount: connected ? snapshot.projects.length : undefined,
      supportingText: connected ? `${snapshot.projects.length} canonical project record${snapshot.projects.length === 1 ? "" : "s"} loaded.` : "Project count unavailable until canonical runtime reconnects."
    },
    {
      key: "active_live",
      title: "Active / Live",
      route: "/active",
      verifiedCount: connected ? active.length : undefined,
      supportingText: connected ? `${active.length} project${active.length === 1 ? "" : "s"} with a claimed executor and fresh verified heartbeat.` : "Live-project count unavailable until canonical runtime reconnects."
    },
    {
      key: "next_up",
      title: "Next Up",
      route: "/next-up",
      verifiedCount: connected ? next.length : undefined,
      supportingText: connected ? `${next.length} project${next.length === 1 ? "" : "s"} with verified roadmap readiness and evidence.` : "Priority queue unavailable until canonical runtime reconnects."
    },
    {
      key: "owner_attention",
      title: "Needs Me",
      route: "/needs-me",
      supportingText: ownerAttention ? truthText(ownerAttention.summary) : "Owner-attention queue unavailable in the current canonical snapshot."
    }
  ]);
  for (const module of grid.modules) {
    const body = module.verifiedCount === undefined ? module.supportingText : `${module.supportingText}`;
    const card = genericCard(module.title, body, undefined, module.route);
    card.classList.add("home-primary-card");
    section.append(card);
  }
  return section;
}
function renderCanonicalSurface(snapshot: CommandCenterRuntimeSnapshot, key: string, label: string, unavailableBody: string): HTMLElement {
  const section = el("section", "screen-stack");
  const surface: RuntimeSurfaceSnapshot | undefined = snapshot.surfaces.find((candidate) => candidate.key === key);
  if (!surface) {
    section.append(emptyState(`${label} unavailable`, `The ${label} surface is not present in the current canonical runtime snapshot. No substitute state is inferred.`, "unavailable"));
    return section;
  }
  if (surface.summary.state !== "known") {
    const disconnectedBody = surface.availability === "disconnected" ? "Canonical runtime data is disconnected. This surface remains unavailable rather than fabricating current state." : unavailableBody;
    section.append(emptyState(`${label} unavailable`, disconnectedBody, surface.availability));
  } else {
    section.append(genericCard(surface.label, truthText(surface.summary), surface.availability));
  }
  if (surface.evidence.length === 0) section.append(genericCard("Evidence", "No current evidence is loaded for this surface.", "unavailable"));
  return section;
}
function renderBrain(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderBrainView(snapshot, activeProvider, () => renderApplication()); }
function renderAgency(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "agency", "Agency", "Agency runtime state is not configured in the current canonical snapshot."); }
function renderNeedsMe(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "needs-me", "Needs Me", "Owner-attention queue state is unavailable in the current canonical snapshot."); }
function renderSearch(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "search", "Search", "Search runtime state is not configured in the current canonical snapshot. No search results are inferred."); }
function renderAutomations(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "automations", "Automations", "Automation runtime state is not configured in the current canonical snapshot. No automation status is inferred."); }
function renderPersonal(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "personal", "Personal", "Personal-operations runtime state is not configured in the current canonical snapshot."); }
function renderFinance(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "finance", "Finance", "Finance runtime state is not configured in the current canonical snapshot."); }
function renderSocial(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "social", "Social & Communications", "Social runtime state is not configured in the current canonical snapshot."); }
function renderBooks(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "books", "Books", "Books runtime state is not configured in the current canonical snapshot."); }
function renderSpecialists(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "specialists", "Specialists", "Specialist runtime state is not configured in the current canonical snapshot."); }
function renderAnalytics(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "analytics", "Analytics", "Analytics runtime state is not configured in the current canonical snapshot."); }
function renderSettings(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "settings", "Settings", "Settings runtime state is not configured in the current canonical snapshot."); }
function renderSecuritySettings(): HTMLElement {
  const section = el("section", "screen-stack");
  section.append(emptyState("Security settings unavailable", "The clean-room security domain exists, but no dedicated security-settings runtime reader is exposed in the current canonical snapshot. General settings are not substituted for security state.", "unavailable"));
  return section;
}
function renderDeviceSettings(): HTMLElement {
  const section = el("section", "screen-stack");
  section.append(emptyState("Device settings unavailable", "The clean-room device/session domain exists, but no dedicated device-settings runtime reader is exposed in the current canonical snapshot. Device state is not inferred.", "unavailable"));
  return section;
}
function renderKnownRoute(snapshot: CommandCenterRuntimeSnapshot, resolution: Extract<BrowserRouteResolution, { state: "known" }>): HTMLElement {
  switch (resolution.kind) {
    case "home": return renderHome(snapshot);
    case "projects": return renderProjects(snapshot);
    case "active-live": return renderActive(snapshot);
    case "next-up": return renderNextUp(snapshot);
    case "project-detail": return renderProjectDetail(snapshot, resolution.resolved.params.projectId ?? "");
    case "brain": return renderBrain(snapshot);
    case "agency": return renderAgency(snapshot);
    case "needs-me": return renderNeedsMe(snapshot);
    case "search": return renderSearch(snapshot);
    case "automations": return renderAutomations(snapshot);
    case "personal": return renderPersonal(snapshot);
    case "finance": return renderFinance(snapshot);
    case "social": return renderSocial(snapshot);
    case "books": return renderBooks(snapshot);
    case "specialists": return renderSpecialists(snapshot);
    case "analytics": return renderAnalytics(snapshot);
    case "settings": return renderSettings(snapshot);
    case "settings-security": return renderSecuritySettings();
    case "settings-devices": return renderDeviceSettings();
  }
}
function renderUnknownRoute(resolution: Exclude<BrowserRouteResolution, { state: "known" }>): HTMLElement {
  const section = el("section", "screen-stack");
  const body = resolution.state === "unmapped-known"
    ? `The declared route ${resolution.routeKey} has no explicit browser renderer. It is blocked instead of falling through to another surface.`
    : `The path ${resolution.path} is not a declared Command Center route. No known surface was substituted.`;
  section.append(emptyState("Route unavailable", body, "unavailable"));
  return section;
}
function navLabel(key: string, title: string): string {
  if (key === "route:home") return "Home";
  if (key === "route:active-live") return "Active";
  if (key === "route:next-up") return "Next";
  return title;
}
function navigation(): HTMLElement {
  const nav = el("nav", "primary-nav");
  nav.setAttribute("aria-label", "Command Center primary navigation");
  const primary = el("div", "bottom-nav__primary");
  const primaryKeys = new Set<string>(PRIMARY_NAV_ROUTE_KEYS);
  for (const key of PRIMARY_NAV_ROUTE_KEYS) {
    const route = ROUTES.get(key);
    if (!route) throw new Error(`Missing primary route: ${key}`);
    const link = routeLink(navLabel(route.key, route.title), route.path, "bottom-nav__link");
    if (window.location.pathname === route.path) link.setAttribute("aria-current", "page");
    primary.append(link);
  }
  const overflow = el("details", "navigation-overflow");
  const summary = el("summary", "navigation-toggle", "More");
  const grid = el("div", "navigation-grid");
  let overflowCurrent = false;
  for (const route of ROUTES.list()) {
    if (primaryKeys.has(route.key) || route.path.includes(":")) continue;
    const link = routeLink(navLabel(route.key, route.title), route.path);
    if (window.location.pathname === route.path) { link.setAttribute("aria-current", "page"); overflowCurrent = true; }
    grid.append(link);
  }
  if (overflowCurrent) overflow.dataset.current = "true";
  overflow.append(summary, grid);
  primary.append(overflow);
  nav.append(primary);
  return nav;
}
function renderHeader(resolved: ResolvedRoute, snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const header = el("header", "app-header");
  if (resolved.route.backBehavior !== "none") {
    const back = el("button", "back-control", "‹");
    back.type = "button";
    back.setAttribute("aria-label", "Back");
    back.addEventListener("click", () => { if (window.history.length > 1) window.history.back(); else navigate("/"); });
    header.append(back);
  }
  const brand = el("div", "brand-lockup");
  const title = resolved.route.key === "route:project-detail" ? snapshot.projects.find((project) => project.id === resolved.params.projectId)?.name ?? resolved.route.title : resolved.route.title;
  brand.append(el("span", "brand-kicker", "COMMAND CENTER"), el("h1", "screen-title", title), el("p", "screen-subtitle", headerSubtitle(resolved)));
  header.append(brand, el("div", "header-planet"));
  return header;
}
function renderUnknownHeader(path: string): HTMLElement {
  const header = el("header", "app-header");
  const back = el("button", "back-control", "‹");
  back.type = "button";
  back.setAttribute("aria-label", "Back");
  back.addEventListener("click", () => { if (window.history.length > 1) window.history.back(); else navigate("/"); });
  const brand = el("div", "brand-lockup");
  brand.append(el("span", "brand-kicker", "COMMAND CENTER"), el("h1", "screen-title", "Route unavailable"), el("p", "screen-subtitle", path));
  header.append(back, brand, el("div", "header-planet"));
  return header;
}

let activeProvider: RuntimeSnapshotProvider | undefined;
const PWA_UPDATES = new BrowserPwaUpdateClient();
let pwaView: PwaUpdateView = PWA_UPDATES.view;
let pwaSubscribed = false;
function renderPwaUpdateControl(): HTMLElement {
  const area = el("div", "pwa-update");
  area.append(el("span", "pwa-update__message", pwaView.message));
  if (pwaView.state === "verified" && pwaView.candidate) {
    const button = el("button", "pwa-update__button", `Activate ${pwaView.candidate.releaseId}`);
    button.type = "button";
    button.addEventListener("click", () => { void PWA_UPDATES.activateVerifiedUpdate(); });
    area.append(button);
  }
  return area;
}
function startPwaUpdates(): void {
  if (!pwaSubscribed) {
    pwaSubscribed = true;
    PWA_UPDATES.subscribe((view) => {
      pwaView = view;
      const current = document.querySelector<HTMLElement>(".pwa-update");
      if (current) current.replaceWith(renderPwaUpdateControl());
    });
  }
  void PWA_UPDATES.registerAndCheck();
}
export async function renderApplication(provider?: RuntimeSnapshotProvider): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("Missing #app root");
  activeProvider ??= provider ?? providerFromDocument(document);
  const snapshot = await activeProvider.load();
  syncShell(snapshot);
  const resolution = resolveBrowserRoute(ROUTES, window.location.pathname);
  document.title = resolution.state === "known" ? `${resolution.resolved.route.title} · Command Center` : "Route unavailable · Command Center";
  root.replaceChildren();
  const shell = el("div", `app-shell app-shell--${APP_SHELL.state}`);
  shell.append(resolution.state === "known" ? renderHeader(resolution.resolved, snapshot) : renderUnknownHeader(resolution.path), renderConnection(snapshot), renderPwaUpdateControl());
  const main = el("main", "screen");
  main.append(resolution.state === "known" ? renderKnownRoute(snapshot, resolution) : renderUnknownRoute(resolution));
  shell.append(main, navigation());
  root.append(shell);
}
window.addEventListener("popstate", () => { void renderApplication(); });
window.addEventListener("online", () => { void renderApplication(); });
window.addEventListener("offline", () => { void renderApplication(); });
startPwaUpdates();
void renderApplication();