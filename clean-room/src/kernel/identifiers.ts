export const IDENTIFIER_SCHEMA_VERSION = 1 as const;

export const ID_PREFIXES = {
  requirement: "req",
  project: "prj",
  company: "cmp",
  brain: "brn",
  domain: "dom",
  condition: "cnd",
  method: "mth",
  module: "mod",
  capability: "cap",
  command: "cmd",
  event: "evt",
  workflow: "wfl",
  agencyRun: "run",
  agencyJob: "job",
  agencyTask: "tsk",
  evidence: "evd",
  asset: "ast",
  provider: "pvd",
  release: "rel",
  decision: "dec",
  rule: "rul",
  checkpoint: "chk",
  conversation: "cnv",
  contextPacket: "ctx"
} as const;

export type IdentifierKind = keyof typeof ID_PREFIXES;
export type IdentifierPrefix = (typeof ID_PREFIXES)[IdentifierKind];

const KIND_BY_PREFIX = Object.freeze(
  Object.fromEntries(Object.entries(ID_PREFIXES).map(([kind, prefix]) => [prefix, kind])) as Record<IdentifierPrefix, IdentifierKind>
);
const TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CANONICAL_ID_PATTERN = /^([a-z]{3})_([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export interface ParsedIdentifier {
  readonly kind: IdentifierKind;
  readonly prefix: IdentifierPrefix;
  readonly token: string;
  readonly value: string;
}

export function createIdentifier(kind: IdentifierKind, token: string): string {
  const normalized = token.trim().toLowerCase();
  if (!TOKEN_PATTERN.test(normalized)) throw new Error(`Invalid identifier token: ${token}`);
  return `${ID_PREFIXES[kind]}_${normalized}`;
}

export function parseIdentifier(value: string): ParsedIdentifier {
  const match = CANONICAL_ID_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid canonical identifier: ${value}`);
  const prefix = match[1] as IdentifierPrefix;
  const token = match[2] as string;
  const kind = KIND_BY_PREFIX[prefix];
  if (!kind) throw new Error(`Unknown identifier prefix: ${prefix}`);
  return Object.freeze({ kind, prefix, token, value });
}

export function assertIdentifierKind(value: string, expected: IdentifierKind): string {
  const parsed = parseIdentifier(value);
  if (parsed.kind !== expected) throw new Error(`Identifier ${value} is ${parsed.kind}, expected ${expected}`);
  return value;
}
