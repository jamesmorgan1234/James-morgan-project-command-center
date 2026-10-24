import { createCoreRouteRegistry, type ResolvedRoute } from "../ui/routes.js";
import { ApplicationShell, type ShellState } from "../ui/shell.js";
import { createHomeGrid } from "../ui/home.js";
import type { TruthValue } from "../data/canonical.js";
import { providerFromDocument, type RuntimeSnapshotProvider } from "./provider.js";
import type { CommandCenterRuntimeSnapshot, RuntimeProjectSnapshot, RuntimeSurfaceSnapshot } from "./snapshot.js";
import { BrowserPwaUpdateClient, type PwaUpdateView } from "./pwa-client.js";
import { resolveBrowserRoute, type BrowserRouteResolution } from "./route-state.js";

const ROUTES = createCoreRouteRegistry();
const APP_SHELL = new ApplicationShell();
const PRIMARY_NAV_ROUTE_KEYS = Object.freeze(["route:home", "route:projects", "route:active-live", "route:next-up"] as const);
const LIVE_EXECUTION_STALE_AFTER_MS = 120_000;

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
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
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
    default: return "Private owner command system";
  }
}
function statusLabel(project: RuntimeProjectSnapshot): string { return project.lifecycle.state === "known" ? project.lifecycle.value.replaceAll("_", " ") : truthText(project.status); }
function projectHref(project: RuntimeProjectSnapshot): string { return `/project/${encodeURIComponent(project.id)}`; }
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
function statusPill(label: string, status: string): HTMLElement {
  const pill = el("span", availabilityClass(status), label);
  pill.prepend(el("span", "status__dot"));
  return pill;
}
function projectIcon(): HTMLElement { const icon = el("div", "project-icon"); icon.setAttribute("aria-hidden", "true"); return icon; }
function artPanel(): HTMLElement { const art = el("div", "project-art"); art.setAttribute("aria-hidden", "true"); return art; }
function chevron(): HTMLElement { return el("span", "row-chevron", "›"); }
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
function projectTitle(project: RuntimeProjectSnapshot): HTMLAnchorElement { return routeLink(project.name, projectHref(project), "project-title"); }
function emptyState(title: string, body: string, status: string): HTMLElement {
  const card = bevelCard("empty-state");
  card.append(el("h2", "section-title", title), el("p", "muted", body), statusPill(status.toUpperCase(), status));
  return card;
}

function renderPortfolioSummary(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const card = bevelCard("portfolio-summary");
  card.append(projectIcon());
  const count = el("div", "portfolio-count");
  count.append(el("strong", undefined, String(snapshot.projects.length)), el("span", undefined, "TOTAL PROJECTS"));
  card.append(count, el("div", "portfolio-breakdown", snapshot.projects.length ? "Canonical project records loaded" : "Canonical project set unavailable"), artPanel(), chevron());
  return card;
}
function renderProjectRow(project: RuntimeProjectSnapshot): HTMLElement {
  const row = bevelCard("project-row");
  const text = el("div", "project-row__text");
  text.append(projectTitle(project), el("p", "project-subtitle", truthText(project.mission)), statusPill(statusLabel(project), project.lifecycle.state === "known" ? project.lifecycle.value : "unavailable"));
  row.append(projectIcon(), text, artPanel(), progressRing(project), chevron());
  return row;
}
function renderProjects(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "screen-stack");
  if (snapshot.connection.state !== "connected" && snapshot.projects.length === 0) {
    section.append(emptyState("Projects unavailable", "No canonical project records are loaded. This is not interpreted as zero projects.", snapshot.connection.state));
    return section;
  }
  section.append(renderPortfolioSummary(snapshot));
  for (const project of snapshot.projects) section.append(renderProjectRow(project));
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
  const row = bevelCard("active-row");
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
  row.append(projectIcon(), text, el("div", "vertical-divider"), scope, artPanel(), chevron());
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
  const row = bevelCard("next-row");
  const text = el("div", "next-row__text");
  const readiness = project.nextWorkReadiness?.state === "known" ? project.nextWorkReadiness.value : undefined;
  const action = project.nextAction.state === "known" ? project.nextAction.value : readiness?.title ?? "N/A";
  text.append(projectTitle(project), statusPill("READY", "ready"), el("p", "next-action", action));
  row.append(projectIcon(), text, artPanel(), chevron());
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

function renderProjectDetail(snapshot: CommandCenterRuntimeSnapshot, projectId: string): HTMLElement {
  const project = snapshot.projects.find((candidate) => candidate.id === projectId);
  const section = el("section", "screen-stack");
  if (!project) {
    section.append(emptyState("Project unavailable", "This project is not present in the current canonical runtime snapshot.", snapshot.connection.state));
    return section;
  }
  const hero = bevelCard("project-hero");
  const heroText = el("div", "project-hero__text");
  heroText.append(el("span", "eyebrow", truthText(project.priority, (value) => `${value} priority`).toUpperCase()), el("h2", "project-hero__title", project.name), el("p", "project-description", truthText(project.mission)), statusPill(statusLabel(project), project.lifecycle.state === "known" ? project.lifecycle.value : "unavailable"));
  hero.append(projectIcon(), heroText, artPanel(), chevron());
  section.append(hero);

  const performance = bevelCard("project-detail-section performance-section");
  performance.append(el("h3", "section-title", "PERFORMANCE"));
  const performanceGrid = el("div", "performance-grid");
  const performanceMetrics: readonly [string, string][] = [
    ["Progress", truthText(project.progressPercent, (value) => `${value}%`)],
    ["Stage", truthText(project.stage)],
    ["Priority", truthText(project.priority)],
    ["Needs Me", truthText(project.needsMeCount)]
  ];
  for (const [label, value] of performanceMetrics) {
    const metric = el("div", "performance-metric");
    metric.append(el("span", "performance-metric__label", label), el("strong", "performance-metric__value", value));
    performanceGrid.append(metric);
  }
  performance.append(performanceGrid);
  section.append(performance);

  const series = bevelCard("project-detail-section series-strip");
  series.append(el("h3", "section-title", "SERIES"), el("p", "muted", "Series data unavailable in the current canonical runtime snapshot."), statusPill("UNAVAILABLE", "unavailable"));
  section.append(series);

  const publication = bevelCard("project-detail-section publication-status");
  publication.append(el("h3", "section-title", "PUBLICATION STATUS"), el("p", "muted", "Publication data unavailable in the current canonical runtime snapshot."), statusPill("UNAVAILABLE", "unavailable"));
  section.append(publication);

  const history = bevelCard("project-detail-section history-row");
  history.append(el("h3", "section-title", "HISTORY"));
  history.append(el("p", "muted", truthText(project.recentActivity, (values) => values.length ? values.join(" · ") : "No verified recent activity")));
  const historyFacts = el("dl", "history-facts");
  const historyRows: readonly [string, string][] = [
    ["Verification", truthText(project.verification)],
    ["Checkpoint", truthText(project.currentCheckpoint)],
    ["Next action", truthText(project.nextAction)],
    ["Blockers", truthText(project.blockers, (values) => values.length ? values.join(" · ") : "None verified")],
    ["Agency", truthText(project.agencyState)]
  ];
  for (const [label, value] of historyRows) historyFacts.append(el("dt", undefined, label), el("dd", undefined, value));
  history.append(historyFacts);
  section.append(history);

  const integrations = bevelCard("project-detail-section integrations-row");
  integrations.append(el("h3", "section-title", "INTEGRATIONS"), el("p", "muted", "Integration data unavailable in the current canonical runtime snapshot."), statusPill("UNAVAILABLE", "unavailable"));
  if (project.specialistKey) integrations.append(el("p", "specialist-note", `Specialist extension: ${project.specialistKey}`));
  section.append(integrations);
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
function renderBrain(snapshot: CommandCenterRuntimeSnapshot): HTMLElement { return renderCanonicalSurface(snapshot, "brain", "Brain", "Brain runtime state is not configured in the current canonical snapshot."); }
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