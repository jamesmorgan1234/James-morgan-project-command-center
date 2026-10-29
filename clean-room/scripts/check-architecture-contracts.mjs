import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL("../src/", import.meta.url));

const nativeConstructors = new Set([
  "Window", "Document", "Element", "HTMLElement", "EventTarget", "Node",
  "Array", "Object", "Promise", "String", "Number"
]);
const violations = [];
const sources = new Map();

function unwrap(node) {
  let current = node;
  while (
    ts.isParenthesizedExpression(current)
    || ts.isAsExpression(current)
    || ts.isTypeAssertionExpression(current)
    || ts.isNonNullExpression(current)
    || ts.isSatisfiesExpression?.(current)
  ) current = current.expression;
  return current;
}

function accessSegments(node) {
  const current = unwrap(node);
  if (ts.isIdentifier(current)) return [current.text];
  if (ts.isPropertyAccessExpression(current)) {
    const parent = accessSegments(current.expression);
    return parent ? [...parent, current.name.text] : undefined;
  }
  if (ts.isElementAccessExpression(current)) {
    const parent = accessSegments(current.expression);
    const argument = unwrap(current.argumentExpression);
    if (!parent || !argument || !ts.isStringLiteralLike(argument)) return undefined;
    return [...parent, argument.text];
  }
  return undefined;
}

function isNativePrototype(node) {
  const segments = accessSegments(node);
  return Boolean(segments && segments.length === 2 && nativeConstructors.has(segments[0]) && segments[1] === "prototype");
}

function isNativePrototypeMember(node) {
  const segments = accessSegments(node);
  return Boolean(segments && segments.length >= 3 && nativeConstructors.has(segments[0]) && segments[1] === "prototype");
}

function isNamedAccess(node, owner, member) {
  const segments = accessSegments(node);
  return Boolean(segments && segments.length === 2 && segments[0] === owner && segments[1] === member);
}

function lineFor(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function record(path, sourceFile, node, label) {
  violations.push(`${path}:${lineFor(sourceFile, node)}: ${label}`);
}

function inspectSource(path, text) {
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);

  function visit(node) {
    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken) {
        const segments = accessSegments(node.left);
        if (segments?.at(-1) === "innerHTML") record(path, sourceFile, node, "incremental innerHTML patch");
      }
      if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken && isNativePrototypeMember(node.left)) {
        record(path, sourceFile, node, "native prototype assignment");
      }
    }

    if (ts.isCallExpression(node)) {
      if (isNamedAccess(node.expression, "document", "write")) {
        record(path, sourceFile, node, "document.write runtime patch");
      }

      const defineProperty = isNamedAccess(node.expression, "Object", "defineProperty")
        || isNamedAccess(node.expression, "Object", "defineProperties")
        || isNamedAccess(node.expression, "Reflect", "defineProperty");
      if (defineProperty && node.arguments[0] && isNativePrototype(node.arguments[0])) {
        record(path, sourceFile, node, "native prototype defineProperty patch");
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function importHasRuntimeEdge(statement) {
  const clause = statement.importClause;
  if (!clause) return true;
  if (clause.isTypeOnly || clause.name) return !clause.isTypeOnly;
  if (!clause.namedBindings || ts.isNamespaceImport(clause.namedBindings)) return true;
  return clause.namedBindings.elements.some((element) => !element.isTypeOnly);
}

function exportHasRuntimeEdge(statement) {
  if (statement.isTypeOnly) return false;
  if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) return true;
  return statement.exportClause.elements.some((element) => !element.isTypeOnly);
}

function runtimeRelativeSpecifiers(path, text) {
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const specifiers = [];
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement)
      && ts.isStringLiteralLike(statement.moduleSpecifier)
      && importHasRuntimeEdge(statement)
    ) {
      specifiers.push(statement.moduleSpecifier.text);
      continue;
    }
    if (
      ts.isExportDeclaration(statement)
      && statement.moduleSpecifier
      && ts.isStringLiteralLike(statement.moduleSpecifier)
      && exportHasRuntimeEdge(statement)
    ) {
      specifiers.push(statement.moduleSpecifier.text);
    }
  }
  return specifiers.filter((specifier) => specifier.startsWith("."));
}

function resolveSourceDependency(importer, specifier, sourcePaths) {
  const absolute = resolve(dirname(importer), specifier);
  const extension = extname(absolute);
  const candidates = [];
  if (extension === ".js") {
    candidates.push(`${absolute.slice(0, -3)}.ts`);
  } else if (extension) {
    candidates.push(absolute);
  } else {
    candidates.push(
      `${absolute}.ts`,
      `${absolute}.mjs`,
      resolve(absolute, "index.ts"),
      resolve(absolute, "index.mjs")
    );
  }
  return candidates.find((candidate) => sourcePaths.has(candidate));
}

function findImportCycle(graph) {
  const visited = new Set();
  const active = new Set();
  const stack = [];

  function visit(path) {
    if (active.has(path)) {
      const start = stack.indexOf(path);
      return [...stack.slice(start), path];
    }
    if (visited.has(path)) return null;

    active.add(path);
    stack.push(path);
    for (const dependency of graph.get(path) ?? []) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    stack.pop();
    active.delete(path);
    visited.add(path);
    return null;
  }

  for (const path of [...graph.keys()].sort()) {
    const cycle = visit(path);
    if (cycle) return cycle;
  }
  return null;
}

function recordImportCycle() {
  const sourcePaths = new Set(sources.keys());
  const graph = new Map();
  for (const [path, text] of sources) {
    const dependencies = runtimeRelativeSpecifiers(path, text)
      .map((specifier) => resolveSourceDependency(path, specifier, sourcePaths))
      .filter(Boolean)
      .sort();
    graph.set(path, dependencies);
  }
  const cycle = findImportCycle(graph);
  if (!cycle) return;
  const display = cycle
    .map((path) => relative(root, path).split(sep).join("/"))
    .join(" -> ");
  violations.push(`import cycle: ${display}`);
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".mjs")) continue;
    const text = await readFile(path, "utf8");
    sources.set(path, text);
    inspectSource(path, text);
  }
}

await walk(root);
recordImportCycle();
if (violations.length > 0) {
  console.error("Architecture source violation detected:");
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log("PASS: architecture source contains no prohibited runtime patch patterns or static relative import cycles.");
