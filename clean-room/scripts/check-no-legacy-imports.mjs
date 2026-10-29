import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL("../src/", import.meta.url));
const prohibited = ["../legacy", "/legacy/", "old-agent", "cc7_agent_", "/archive/"];
const violations = [];

function prohibitedSpecifier(specifier) {
  return prohibited.find((marker) => specifier.includes(marker));
}

function recordViolation(path, sourceFile, node, specifier, marker) {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  violations.push(`${path}:${line + 1}: prohibited legacy module specifier ${JSON.stringify(specifier)} (${marker})`);
}

function stringValue(node) {
  if (!node) return undefined;
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

function inspectSource(path, text) {
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);

  function inspectSpecifier(node, specifierNode) {
    const specifier = stringValue(specifierNode);
    if (specifier === undefined) return;
    const marker = prohibitedSpecifier(specifier);
    if (marker) recordViolation(path, sourceFile, node, specifier, marker);
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      inspectSpecifier(node, node.moduleSpecifier);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      inspectSpecifier(node, node.moduleReference.expression);
    } else if (ts.isImportTypeNode(node)) {
      const argument = ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined;
      inspectSpecifier(node, argument);
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (isDynamicImport || isRequire) inspectSpecifier(node, node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!entry.name.endsWith(".ts")) continue;
    inspectSource(path, await readFile(path, "utf8"));
  }
}

await walk(root);
if (violations.length > 0) {
  console.error("Legacy runtime dependency detected in clean-room imports:");
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log("PASS: no legacy runtime imports detected in clean-room source.");
