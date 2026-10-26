export function expandPhaseManifest(manifest) {
  const phaseIds = [];
  const categoryByPhase = new Map();
  for (const category of manifest.categories ?? []) {
    const spec = category.phaseSpec;
    if (!spec || !Number.isInteger(spec.start) || !Number.isInteger(spec.end) || !spec.prefix) throw new Error(`invalid phaseSpec for ${category.id}`);
    const ids = [];
    for (let n = spec.start; n <= spec.end; n += 1) ids.push(`${spec.prefix}${n}`);
    if (ids.length !== category.count) throw new Error(`count mismatch for ${category.id}: ${ids.length} != ${category.count}`);
    for (const id of ids) {
      if (categoryByPhase.has(id)) throw new Error(`duplicate phase id ${id}`);
      phaseIds.push(id);
      categoryByPhase.set(id, category.id);
    }
  }
  if (phaseIds.length !== manifest.currentPhaseCount) throw new Error(`phase total mismatch: ${phaseIds.length} != ${manifest.currentPhaseCount}`);
  return { phaseIds, categoryByPhase };
}

export function assertAcyclic(nodes, dependencies, label = "graph") {
  const visiting = new Set();
  const visited = new Set();
  const nodeSet = new Set(nodes);
  function visit(node, stack = []) {
    if (visiting.has(node)) throw new Error(`${label} cycle: ${[...stack, node].join(" -> ")}`);
    if (visited.has(node)) return;
    if (!nodeSet.has(node)) throw new Error(`${label} unknown node ${node}`);
    visiting.add(node);
    for (const dep of dependencies[node] ?? []) {
      if (!nodeSet.has(dep)) throw new Error(`${label} ${node} depends on unknown ${dep}`);
      visit(dep, [...stack, node]);
    }
    visiting.delete(node);
    visited.add(node);
  }
  for (const node of nodes) visit(node);
  return true;
}

export function categoryDependencies(manifest) {
  return Object.fromEntries((manifest.categories ?? []).map((c) => [c.id, c.dependsOn ?? []]));
}

export function extractRoadmapPhaseIds(markdown) {
  const ids = new Set();
  for (const match of markdown.matchAll(/`(P(?:IF|\d+)\.\d+)`\s+—/g)) ids.add(match[1]);
  return [...ids];
}

export function extractAmendmentSections(markdown) {
  const matches = [...markdown.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    return { number: Number(match[1]), title: match[2].trim(), body: markdown.slice(start, end).trim() };
  });
}

export function deriveAtomicRequirements(section) {
  const atoms = [];
  const lines = section.body.split(/\r?\n/);
  let paragraph = [];
  const flush = () => {
    const text = paragraph.join(" ").replace(/\s+/g, " ").trim();
    paragraph = [];
    if (text && !/^###\s+/.test(text)) atoms.push(text);
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (/^###\s+/.test(line)) { flush(); continue; }
    const bullet = line.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
    if (bullet) { flush(); atoms.push(bullet[1].trim()); continue; }
    paragraph.push(line.replace(/^>\s?/, ""));
  }
  flush();
  return atoms.filter((text) => text.length > 2).map((text, index) => ({
    id: `A20-S${String(section.number).padStart(2, "0")}-R${String(index + 1).padStart(3, "0")}`,
    text
  }));
}

export function validateSectionCoverage(sections, mapping) {
  if (sections.length !== 45) throw new Error(`Amendment 20 section count ${sections.length} != 45`);
  const numbers = new Set(sections.map((s) => String(s.number)));
  for (let n = 1; n <= 45; n += 1) {
    const key = String(n);
    if (!numbers.has(key)) throw new Error(`missing Amendment 20 section ${n}`);
    const entry = mapping.sections?.[key];
    if (!entry || !Array.isArray(entry.owners) || entry.owners.length === 0) throw new Error(`missing owners for Amendment 20 section ${n}`);
    if (!Array.isArray(entry.testClasses) || entry.testClasses.length === 0) throw new Error(`missing test classes for Amendment 20 section ${n}`);
  }
  return true;
}

export function validateEvidenceReceipt(receipt, { phaseId, headSha } = {}) {
  if (!receipt || receipt.status !== "VERIFIED_COMPLETE") return false;
  if (phaseId && receipt.phaseId !== phaseId) return false;
  if (headSha && receipt.gitSha !== headSha) return false;
  if (!Array.isArray(receipt.evidence) || receipt.evidence.length === 0) return false;
  return true;
}

export function assertResumeState(text) {
  if (!/BUILD RESUMED/i.test(text)) throw new Error("current authority pointer does not record BUILD RESUMED");
  if (!/R1 ACTIVE/i.test(text)) throw new Error("current authority pointer does not identify R1 ACTIVE");
  if (/DO NOT RESUME BUILD EXECUTION/i.test(text)) throw new Error("stale audit-pause prohibition remains in current authority pointer");
  return true;
}
