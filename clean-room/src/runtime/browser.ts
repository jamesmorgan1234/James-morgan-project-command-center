import { createCoreRouteRegistry, type ResolvedRoute } from "../ui/routes.js";
import { ApplicationShell, type ShellState } from "../ui/shell.js";
import type { TruthValue } from "../data/canonical.js";
import { providerFromDocument, type RuntimeSnapshotProvider } from "./provider.js";
import type { CommandCenterRuntimeSnapshot, RuntimeProjectSnapshot, RuntimeSurfaceSnapshot } from "./snapshot.js";
import { BrowserPwaUpdateClient, type PwaUpdateView } from "./pwa-client.js";
import { resolveBrowserRoute, type BrowserRouteResolution } from "./route-state.js";

const ROUTES = createCoreRouteRegistry();
const APP_SHELL = new ApplicationShell();

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
function navigate(path: string): void { if (window.location.pathname === path) return; window.history.pushState({}, "", path); void renderApplication(); }
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
  strip.append(el("strong", availabilityClass(snapshot.connection.state), snapshot.connection.state.toUpperCase()), el("span", "connection-message", snapshot.connection.message), el("span", "connection-sync", `Last sync: ${truthText(snapshot.connection.lastSuccessfulSyncAt)}`));
  return strip;
}
function bevelCard(className = ""): HTMLElement { return el("article", `bevel-card ${className}`.trim()); }
function statusPill(label: string, status: string): HTMLElement { const pill = el("span", availabilityClass(status), label); pill.prepend(el("span", "status__dot")); return pill; }
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

function activeProjects(snapshot: CommandCenterRuntimeSnapshot): readonly RuntimeProjectSnapshot[] { return snapshot.projects.filter((project) => project.lifecycle.state === "known" && ["active", "live"].includes(project.lifecycle.value)); }
function renderActiveRow(project: RuntimeProjectSnapshot): HTMLElement {
  const row = bevelCard("active-row");
  const text = el("div", "active-row__text");
  text.append(projectTitle(project), statusPill(statusLabel(project), project.lifecycle.state === "known" ? project.lifecycle.value : "unavailable"), el("p", "next-action", truthText(project.nextAction)));
  const scope = el("div", "scope-column");
  scope.append(el("strong", undefined, truthText(project.progressPercent, (value) => `${value}%`)), el("span", "metric-label", "Scope"), el("span", "sync-note", project.agencyState.state === "known" ? project.agencyState.value : "Execution state unavailable"));
  row.append(projectIcon(), text, el("div", "vertical-divider"), scope, artPanel(), chevron());
  return row;
}
function renderActive(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "screen-stack");
  const projects = activeProjects(snapshot);
  if (projects.length === 0) {
    section.append(emptyState("No verified live projects", "No project in the current canonical snapshot is verified as active/live. This does not mean none exist outside the snapshot.", snapshot.connection.state));
    return section;
  }
  for (const project of projects) section.append(renderActiveRow(project));
  return section;
}

const PRIORITY_RANK: Readonly<Record<string, number>> = Object.freeze({ critical: 0, high: 1, normal: 2, low: 3 });
function nextProjects(snapshot: CommandCenterRuntimeSnapshot): readonly RuntimeProjectSnapshot[] { return Object.freeze([...snapshot.projects].filter((project) => project.nextAction.state === "known").sort((a, b) => (a.priority.state === "known" ? PRIORITY_RANK[a.priority.value] ?? 9 : 9) - (b.priority.state === "known" ? PRIORITY_RANK[b.priority.value] ?? 9 : 9))); }
function renderNextRow(project: RuntimeProjectSnapshot): HTMLElement {
  const row = bevelCard("next-row");
  const text = el("div", "next-row__text");
  text.append(projectTitle(project), statusPill(statusLabel(project), project.lifecycle.state === "known" ? project.lifecycle.value : "unavailable"), el("p", "next-action", truthText(project.nextAction)));
  row.append(projectIcon(), text, artPanel(), chevron());
  return row;
}
function renderNextUp(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "screen-stack");
  const projects = nextProjects(snapshot);
  if (projects.length === 0) {
    section.append(emptyState("Priority queue unavailable", "No canonical project currently has a verified exact next action in this snapshot.", snapshot.connection.state));
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
  const details = bevelCard("detail-grid-card");
  details.append(el("h3", "section-title", "PROJECT STATUS"));
  const grid = el("dl", "detail-grid");
  const rows: readonly [string, string][] = [["Lifecycle", truthText(project.lifecycle)], ["Verification", truthText(project.verification)], ["Priority", truthText(project.priority)], ["Progress", truthText(project.progressPercent, (value) => `${value}%`)], ["Checkpoint", truthText(project.currentCheckpoint)], ["Next action", truthText(project.nextAction)], ["Blockers", truthText(project.blockers, (values) => values.length ? values.join(" · ") : "None verified")], ["Agency", truthText(project.agencyState)]];
  for (const [label, value] of rows) grid.append(el("dt", undefined, label), el("dd", undefined, value));
  details.append(grid);
  if (project.specialistKey) details.append(el("p", "muted", `Specialist extension: ${project.specialistKey}`));
  section.append(details);
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
  section.append(genericCard("Projects", snapshot.projects.length > 0 ? `${snapshot.projects.length} canonical project record${snapshot.projects.length === 1 ? "" : "s"} loaded.` : "Project count unavailable", snapshot.connection.state, "/projects"));
  for (const key of ["needs-me", "agency"]) {
    const surface = snapshot.surfaces.find((candidate) => candidate.key === key);
    section.append(genericCard(surface?.label ?? key, surface ? truthText(surface.summary) : "N/A", surface?.availability ?? "unavailable", `/${key}`));
  }
  section.append(genericCard("Release", truthText(snapshot.release.releaseId), snapshot.release.releaseId.state === "known" ? "available" : "unavailable"));
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
function navigation(): HTMLElement {
  const nav = el("nav", "primary-nav");
  nav.setAttribute("aria-label", "Command Center");
  const menu = el("details", "navigation-menu");
  menu.append(el("summary", "navigation-toggle", "Navigate"));
  const grid = el("div", "navigation-grid");
  for (const route of ROUTES.list()) {
    if (route.path.includes(":")) continue;
    const label = route.key === "route:home" ? "Home" : route.key === "route:active-live" ? "Active" : route.title;
    const link = routeLink(label, route.path);
    if (window.location.pathname === route.path) link.setAttribute("aria-current", "page");
    grid.append(link);
  }
  menu.append(grid);
  nav.append(menu);
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
  shell.append(resolution.state === "known" ? renderHeader(resolution.resolved, snapshot) : renderUnknownHeader(resolution.path), renderConnection(snapshot), navigation(), renderPwaUpdateControl());
  const main = el("main", "screen");
  main.append(resolution.state === "known" ? renderKnownRoute(snapshot, resolution) : renderUnknownRoute(resolution));
  shell.append(main);
  root.append(shell);
}
window.addEventListener("popstate", () => { void renderApplication(); });
window.addEventListener("online", () => { void renderApplication(); });
window.addEventListener("offline", () => { void renderApplication(); });
startPwaUpdates();
void renderApplication();
