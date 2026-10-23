import { createCoreRouteRegistry, type ResolvedRoute } from "../ui/routes.js";
import type { TruthValue } from "../data/canonical.js";
import { providerFromDocument, type RuntimeSnapshotProvider } from "./provider.js";
import type { CommandCenterRuntimeSnapshot, RuntimeProjectSnapshot, RuntimeSurfaceSnapshot } from "./snapshot.js";
import { BrowserPwaUpdateClient, type PwaUpdateView } from "./pwa-client.js";

const ROUTES = createCoreRouteRegistry();

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function truthText<T>(truth: TruthValue<T>, format: (value: T) => string = (value) => String(value)): string {
  if (truth.state === "known") return format(truth.value);
  if (truth.state === "not_applicable") return "Not applicable";
  return "Unknown";
}

function availabilityClass(value: string): string {
  return `status status--${value.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
}

function navigate(path: string): void {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  void renderApplication();
}

function link(label: string, path: string): HTMLAnchorElement {
  const anchor = el("a", "nav-link", label);
  anchor.href = path;
  anchor.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(path);
  });
  return anchor;
}

function renderConnection(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const strip = el("section", "connection-strip");
  strip.append(el("strong", availabilityClass(snapshot.connection.state), snapshot.connection.state.toUpperCase()));
  strip.append(el("span", "connection-message", snapshot.connection.message));
  const sync = el("span", "connection-sync", `Last sync: ${truthText(snapshot.connection.lastSuccessfulSyncAt)}`);
  strip.append(sync);
  return strip;
}

function card(title: string, body: string, status?: string): HTMLElement {
  const node = el("article", "cc-card");
  const heading = el("div", "cc-card__heading");
  heading.append(el("h3", "cc-card__title", title));
  if (status) heading.append(el("span", availabilityClass(status), status.replaceAll("_", " ")));
  node.append(heading, el("p", "cc-card__body", body));
  return node;
}

function renderHome(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "screen-grid");
  const knownProjectCount = snapshot.projects.length;
  section.append(card("Projects", knownProjectCount > 0 ? `${knownProjectCount} canonical project record${knownProjectCount === 1 ? "" : "s"} loaded.` : "No canonical project records are currently loaded.", snapshot.connection.state));
  const needsMe = snapshot.surfaces.find((surface) => surface.key === "needs-me");
  section.append(card("Needs Me", needsMe ? truthText(needsMe.summary) : "Unknown", needsMe?.availability ?? "unavailable"));
  const agency = snapshot.surfaces.find((surface) => surface.key === "agency");
  section.append(card("Agency", agency ? truthText(agency.summary) : "Unknown", agency?.availability ?? "unavailable"));
  const release = truthText(snapshot.release.releaseId);
  section.append(card("Release", release, snapshot.release.releaseId.state === "known" ? "available" : "unavailable"));
  return section;
}

function projectCard(project: RuntimeProjectSnapshot): HTMLElement {
  const node = el("article", "cc-card cc-card--project");
  const title = el("a", "project-link", project.name);
  title.href = `/project/${encodeURIComponent(project.id)}`;
  title.addEventListener("click", (event) => { event.preventDefault(); navigate(title.getAttribute("href") ?? "/projects"); });
  node.append(title);
  const rows: readonly [string, string][] = [
    ["Stage", truthText(project.stage)],
    ["Status", truthText(project.status)],
    ["Progress", truthText(project.progressPercent, (value) => `${value}%`)],
    ["Next", truthText(project.nextAction)]
  ];
  const list = el("dl", "fact-list");
  for (const [label, value] of rows) {
    list.append(el("dt", undefined, label), el("dd", undefined, value));
  }
  node.append(list);
  return node;
}

function renderProjects(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "screen-grid");
  if (snapshot.projects.length === 0) {
    section.append(card("Projects unavailable", "No canonical project records are loaded. This is not interpreted as zero projects.", snapshot.connection.state));
    return section;
  }
  for (const project of snapshot.projects) section.append(projectCard(project));
  return section;
}

function renderProjectDetail(snapshot: CommandCenterRuntimeSnapshot, projectId: string): HTMLElement {
  const project = snapshot.projects.find((candidate) => candidate.id === projectId);
  const section = el("section", "screen-grid");
  if (!project) {
    section.append(card("Project unavailable", "This project is not present in the current canonical runtime snapshot.", snapshot.connection.state));
    return section;
  }
  const details: readonly [string, string][] = [
    ["Stage", truthText(project.stage)],
    ["Status", truthText(project.status)],
    ["Progress", truthText(project.progressPercent, (value) => `${value}%`)],
    ["Checkpoint", truthText(project.currentCheckpoint)],
    ["Next action", truthText(project.nextAction)],
    ["Blockers", truthText(project.blockers, (values) => values.length ? values.join(" · ") : "None verified")],
    ["Needs Me", truthText(project.needsMeCount, (value) => String(value))],
    ["Agency", truthText(project.agencyState)]
  ];
  const detailCard = el("article", "cc-card cc-card--detail");
  detailCard.append(el("h2", "project-link", project.name));
  const list = el("dl", "fact-list");
  for (const [label, value] of details) list.append(el("dt", undefined, label), el("dd", undefined, value));
  detailCard.append(list);
  if (project.specialistKey) detailCard.append(el("p", "specialist-note", `Specialist extension: ${project.specialistKey}`));
  section.append(detailCard);
  return section;
}

function renderSurface(snapshot: CommandCenterRuntimeSnapshot, key: string, label: string): HTMLElement {
  const section = el("section", "screen-grid");
  const surface: RuntimeSurfaceSnapshot | undefined = snapshot.surfaces.find((candidate) => candidate.key === key);
  if (!surface) {
    section.append(card(label, "This surface is not present in the current canonical snapshot.", "unavailable"));
    return section;
  }
  section.append(card(surface.label, truthText(surface.summary), surface.availability));
  if (surface.evidence.length === 0) section.append(card("Evidence", "No current evidence is loaded for this surface.", "unavailable"));
  return section;
}

function surfaceKey(route: ResolvedRoute): string {
  return route.route.key.replace("route:", "").replace(/^settings-.+$/, "settings");
}

function renderRoute(snapshot: CommandCenterRuntimeSnapshot, resolved: ResolvedRoute): HTMLElement {
  switch (resolved.route.key) {
    case "route:home": return renderHome(snapshot);
    case "route:projects":
    case "route:active-live":
    case "route:next-up": return renderProjects(snapshot);
    case "route:project-detail": return renderProjectDetail(snapshot, resolved.params.projectId ?? "");
    default: return renderSurface(snapshot, surfaceKey(resolved), resolved.route.title);
  }
}

function navigation(): HTMLElement {
  const nav = el("nav", "primary-nav");
  nav.setAttribute("aria-label", "Command Center");
  const items: readonly [string, string][] = [
    ["Home", "/"], ["Projects", "/projects"], ["Brain", "/brain"], ["Agency", "/agency"], ["Needs Me", "/needs-me"],
    ["Search", "/search"], ["Automations", "/automations"], ["Personal", "/personal"], ["Finance", "/finance"], ["Social", "/social"],
    ["Books", "/books"], ["Specialists", "/specialists"], ["Analytics", "/analytics"], ["Settings", "/settings"]
  ];
  for (const [label, path] of items) nav.append(link(label, path));
  return nav;
}

let activeProvider: RuntimeSnapshotProvider | undefined;
let latestSnapshot: CommandCenterRuntimeSnapshot | undefined;
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
  latestSnapshot = await activeProvider.load();
  const resolved = ROUTES.resolve(window.location.pathname) ?? ROUTES.resolve("/");
  if (!resolved) throw new Error("Core home route is missing");
  document.title = `${resolved.route.title} · Command Center`;
  root.replaceChildren();
  const shell = el("div", "app-shell");
  const header = el("header", "app-header");
  const brand = el("div", "brand-lockup");
  brand.append(el("span", "brand-kicker", "COMMAND CENTER"), el("h1", "screen-title", resolved.route.title));
  header.append(brand, renderPwaUpdateControl());
  shell.append(header, renderConnection(latestSnapshot), navigation());
  const main = el("main", "screen");
  main.append(renderRoute(latestSnapshot, resolved));
  shell.append(main);
  root.append(shell);
}

window.addEventListener("popstate", () => { void renderApplication(); });
window.addEventListener("online", () => { void renderApplication(); });
window.addEventListener("offline", () => { void renderApplication(); });

startPwaUpdates();
void renderApplication();
