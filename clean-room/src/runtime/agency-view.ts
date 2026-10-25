import type { CommandCenterRuntimeSnapshot, RuntimeAgencyRunSnapshot, RuntimeAgencyTaskSnapshot } from "./snapshot.js";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function availabilityClass(value: string): string {
  return `status status--${value.replace(/[^a-z0-9-]/giu, "-").toLowerCase()}`;
}

function pill(label: string, state: string): HTMLElement {
  const node = el("span", availabilityClass(state), label);
  node.prepend(el("span", "status__dot"));
  return node;
}

function card(className = ""): HTMLElement {
  return el("article", `bevel-card agency-card ${className}`.trim());
}

function emptyState(title: string, body: string, state: string): HTMLElement {
  const node = card("agency-empty-state");
  node.append(el("h2", "section-title", title), el("p", "muted", body), pill(state.toUpperCase(), state));
  return node;
}

function countByState(tasks: readonly RuntimeAgencyTaskSnapshot[], states: readonly string[]): number {
  const accepted = new Set(states);
  return tasks.filter((task) => accepted.has(task.state.toLowerCase())).length;
}

function runCard(run: RuntimeAgencyRunSnapshot, taskCount: number, jobCount: number): HTMLElement {
  const node = card("agency-run-card");
  const heading = el("div", "card-heading");
  heading.append(el("h3", "section-title", run.objective), pill(run.state.replaceAll("_", " ").toUpperCase(), run.state));
  node.append(heading);
  const facts = el("dl", "history-facts");
  facts.append(
    el("dt", undefined, "Run"), el("dd", undefined, run.runId),
    el("dt", undefined, "Project"), el("dd", undefined, run.projectId),
    el("dt", undefined, "Control mode"), el("dd", undefined, run.controlMode.replaceAll("_", " ")),
    el("dt", undefined, "Generation"), el("dd", undefined, String(run.generation)),
    el("dt", undefined, "Priority"), el("dd", undefined, String(run.priority)),
    el("dt", undefined, "Jobs"), el("dd", undefined, String(jobCount)),
    el("dt", undefined, "Tasks"), el("dd", undefined, String(taskCount)),
    el("dt", undefined, "Stop requested"), el("dd", undefined, run.stopRequested ? "Yes" : "No"),
    el("dt", undefined, "Pause requested"), el("dd", undefined, run.pauseRequested ? "Yes" : "No"),
    el("dt", undefined, "Updated"), el("dd", undefined, run.updatedAt)
  );
  if (run.checkpointId) facts.append(el("dt", undefined, "Checkpoint"), el("dd", undefined, run.checkpointId));
  if (run.blocker) facts.append(el("dt", undefined, "Blocker"), el("dd", undefined, run.blocker));
  node.append(facts, el("p", "muted", `${run.evidence.length} canonical evidence ref${run.evidence.length === 1 ? "" : "s"}.`));
  return node;
}

function attentionTaskCard(task: RuntimeAgencyTaskSnapshot): HTMLElement {
  const node = card("agency-task-card");
  const heading = el("div", "card-heading");
  heading.append(el("h3", "section-title", task.title), pill(task.state.replaceAll("_", " ").toUpperCase(), task.state));
  node.append(heading);
  const facts = el("dl", "history-facts");
  facts.append(
    el("dt", undefined, "Task"), el("dd", undefined, task.taskId),
    el("dt", undefined, "Project"), el("dd", undefined, task.projectId),
    el("dt", undefined, "Capability"), el("dd", undefined, task.capability),
    el("dt", undefined, "Environment"), el("dd", undefined, task.preferredEnvironment.replaceAll("_", " ")),
    el("dt", undefined, "Risk"), el("dd", undefined, task.risk),
    el("dt", undefined, "Cost"), el("dd", undefined, task.costClass),
    el("dt", undefined, "Retries"), el("dd", undefined, String(task.retryCount)),
    el("dt", undefined, "Verification refs"), el("dd", undefined, String(task.verificationRefs.length)),
    el("dt", undefined, "Updated"), el("dd", undefined, task.updatedAt)
  );
  if (task.checkpointRef) facts.append(el("dt", undefined, "Checkpoint"), el("dd", undefined, task.checkpointRef));
  if (task.blocker) facts.append(el("dt", undefined, "Blocker"), el("dd", undefined, task.blocker));
  node.append(facts);
  return node;
}

export function renderAgencyView(snapshot: CommandCenterRuntimeSnapshot): HTMLElement {
  const section = el("section", "screen-stack agency-screen");
  const agency = snapshot.agency;
  if (!agency || agency.availability !== "available") {
    section.append(emptyState("Agency unavailable", "The durable Category 7 run/job/task sources are not all available in the current canonical runtime snapshot. Partial or legacy execution state is not substituted.", agency?.availability ?? snapshot.connection.state));
    return section;
  }

  const queryProject = new URLSearchParams(window.location.search).get("project")?.trim() || undefined;
  const project = queryProject ? snapshot.projects.find((candidate) => candidate.id === queryProject) : undefined;
  const runs = queryProject ? agency.runs.filter((run) => run.projectId === queryProject) : agency.runs;
  const jobs = queryProject ? agency.jobs.filter((job) => job.projectId === queryProject) : agency.jobs;
  const tasks = queryProject ? agency.tasks.filter((task) => task.projectId === queryProject) : agency.tasks;
  const nonterminalRuns = runs.filter((run) => ["queued", "working", "paused", "blocked", "needs_user"].includes(run.state.toLowerCase()));
  const attentionTasks = tasks.filter((task) => ["blocked", "needs_user", "work_boundary"].includes(task.state.toLowerCase()));
  const workingTasks = countByState(tasks, ["working"]);
  const verifiedTasks = countByState(tasks, ["verified"]);

  const overview = card("agency-overview");
  const heading = el("div", "card-heading");
  heading.append(el("h2", "section-title", "DURABLE EXECUTION TRUTH"), pill("CANONICAL", "available"));
  overview.append(heading);
  if (queryProject) {
    overview.append(el("p", "muted", project ? `Project scope: ${project.name} · ${queryProject}` : `Project scope: ${queryProject}. No project profile is present in the current canonical snapshot.`));
  } else {
    overview.append(el("p", "muted", "Portfolio scope: all canonical Category 7 Agency runs, jobs and tasks currently loaded for the owner."));
  }
  const metrics = el("div", "performance-grid");
  for (const [label, value] of [
    ["Runs", runs.length],
    ["Nonterminal", nonterminalRuns.length],
    ["Jobs", jobs.length],
    ["Tasks", tasks.length],
    ["Working tasks", workingTasks],
    ["Needs handling", attentionTasks.length],
    ["Verified tasks", verifiedTasks]
  ] as const) {
    const metric = el("div", "performance-metric");
    metric.append(el("span", "performance-metric__label", label), el("strong", "performance-metric__value", String(value)));
    metrics.append(metric);
  }
  overview.append(metrics, el("p", "muted", "This surface is read-only execution truth. It does not authorize protected actions, infer successful external effects, or classify a project as Active / Live without a claimed executor and fresh verified heartbeat."));
  section.append(overview);

  if (attentionTasks.length > 0) {
    const attention = card("agency-attention");
    attention.append(el("h2", "section-title", "BLOCKED / OWNER / WORK-BOUNDARY TASKS"), el("p", "muted", `${attentionTasks.length} canonical task${attentionTasks.length === 1 ? "" : "s"} currently require explicit handling.`));
    section.append(attention);
    for (const task of attentionTasks.slice(0, 20)) section.append(attentionTaskCard(task));
    if (attentionTasks.length > 20) {
      const truncation = card("agency-truncation");
      truncation.append(el("p", "muted", `${attentionTasks.length - 20} additional attention task records remain in the snapshot.`));
      section.append(truncation);
    }
  }

  if (runs.length === 0) {
    section.append(emptyState("No durable Agency runs", queryProject ? "No Category 7 run is recorded for this project in the current canonical snapshot." : "No Category 7 run is recorded in the current canonical snapshot.", "available"));
    return section;
  }

  const runsHeading = card("agency-runs-heading");
  runsHeading.append(el("h2", "section-title", "RECENT DURABLE RUNS"), el("p", "muted", "Run state comes from command_center_agency_runs; job/task counts are joined by durable run identity."));
  section.append(runsHeading);
  for (const run of runs.slice(0, 30)) {
    section.append(runCard(run, tasks.filter((task) => task.runId === run.runId).length, jobs.filter((job) => job.runId === run.runId).length));
  }
  if (runs.length > 30) {
    const truncation = card("agency-truncation");
    truncation.append(el("p", "muted", `${runs.length - 30} additional run records remain in the snapshot.`));
    section.append(truncation);
  }
  return section;
}
