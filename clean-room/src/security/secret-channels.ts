import { assertReferenceOnly } from "./secrets.js";

export type SecretRestrictedChannel = "client_bundle" | "log" | "brain_memory" | "url" | "note";

const CHANNELS = new Set<SecretRestrictedChannel>(["client_bundle", "log", "brain_memory", "url", "note"]);
const SECRET_TEXT_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/giu,
  /\bsk-[A-Za-z0-9_-]{12,}\b/gu,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/gu,
  /\bAIza[0-9A-Za-z_-]{30,}\b/gu,
  /\bxoxb-[A-Za-z0-9-]{12,}\b/gu,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}={0,2}\b/giu
] as const;
const URL_SECRET_PARAMETER = /([?&](?:access_token|refresh_token|token|secret|password|api[_-]?key|client_secret)=)[^&#\s]+/giu;
const URL_USERINFO_PASSWORD = /(https?:\/\/[^:@/\s]+:)[^@/\s]+@/giu;

function hasSecretText(value: string): boolean {
  for (const pattern of SECRET_TEXT_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(value)) return true;
  }
  URL_SECRET_PARAMETER.lastIndex = 0;
  if (URL_SECRET_PARAMETER.test(value)) return true;
  URL_USERINFO_PASSWORD.lastIndex = 0;
  return URL_USERINFO_PASSWORD.test(value);
}

function inspectStrings(value: unknown, seen: WeakSet<object>): void {
  if (typeof value === "string") {
    if (hasSecretText(value)) throw new Error("Secret-like material is forbidden in restricted output channels");
    return;
  }
  if (typeof value !== "object" || value === null) return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const entry of value) inspectStrings(entry, seen);
    return;
  }
  for (const entry of Object.values(value as Record<string, unknown>)) inspectStrings(entry, seen);
}

export function assertSecretChannelSafe(channel: SecretRestrictedChannel, payload: unknown): void {
  if (!CHANNELS.has(channel)) throw new Error("Unknown secret-restricted channel");
  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    assertReferenceOnly(payload as Record<string, unknown>);
  } else {
    assertReferenceOnly({ content: payload });
  }
  inspectStrings(payload, new WeakSet<object>());
}

export function redactSecretText(text: string): string {
  let redacted = text;
  for (const pattern of SECRET_TEXT_PATTERNS) {
    pattern.lastIndex = 0;
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  URL_SECRET_PARAMETER.lastIndex = 0;
  redacted = redacted.replace(URL_SECRET_PARAMETER, "$1[REDACTED]");
  URL_USERINFO_PASSWORD.lastIndex = 0;
  redacted = redacted.replace(URL_USERINFO_PASSWORD, "$1[REDACTED]@");
  return redacted;
}
