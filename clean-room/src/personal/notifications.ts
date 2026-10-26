export type NotificationSeverity = "critical" | "high" | "normal" | "low";

const SEVERITY_RANK: Readonly<Record<NotificationSeverity, number>> = Object.freeze({ critical: 0, high: 1, normal: 2, low: 3 });
const SENSITIVE_LINK = /(?:token|password|secret|api[_-]?key|authorization)=/i;

export interface NotificationIntent {
  readonly id: string;
  readonly ownerId: string;
  readonly dedupeKey: string;
  readonly severity: NotificationSeverity;
  readonly title: string;
  readonly body: string;
  readonly sensitivityRank: number;
  readonly deepLink?: string;
  readonly sourceRefs: readonly string[];
}

export interface NotificationChannelPolicy {
  readonly channel: string;
  readonly enabled: boolean;
  readonly maxSensitivityRank: number;
  readonly quiet: boolean;
  readonly maxBundles?: number;
  readonly acknowledgedIntentIds?: readonly string[];
}

export interface RoutedNotification {
  readonly ownerId: string;
  readonly intentIds: readonly string[];
  readonly channel: string;
  readonly title: string;
  readonly body: string;
  readonly deepLink?: string;
  readonly minimized: boolean;
  readonly severity: NotificationSeverity;
}

export interface NotificationAcknowledgement {
  readonly ownerId: string;
  readonly intentId: string;
  readonly acknowledgedAt: string;
  readonly evidenceRefs: readonly string[];
}

function timestamp(value: string): void { if (!Number.isFinite(Date.parse(value))) throw new Error("Notification acknowledgement timestamp is invalid"); }
function safeDeepLink(value: string | undefined): string | undefined { return value && value.trim() && !SENSITIVE_LINK.test(value) ? value : undefined; }

export function acknowledgeNotification(ownerId: string, intentId: string, acknowledgedAt: string, evidenceRefs: readonly string[]): NotificationAcknowledgement {
  if (!ownerId.trim() || !intentId.trim()) throw new Error("Notification acknowledgement owner/intent are required");
  timestamp(acknowledgedAt);
  const evidence = [...new Set(evidenceRefs.map((ref) => ref.trim()))];
  if (evidence.length === 0 || evidence.some((ref) => !ref)) throw new Error("Notification acknowledgement evidence is required");
  return Object.freeze({ ownerId, intentId, acknowledgedAt, evidenceRefs: Object.freeze(evidence) });
}

export function routeNotifications(intents: readonly NotificationIntent[], policy: NotificationChannelPolicy): readonly RoutedNotification[] {
  if (!policy.enabled) return Object.freeze([]);
  if (!policy.channel.trim() || !Number.isFinite(policy.maxSensitivityRank) || policy.maxSensitivityRank < 0) throw new Error("Notification channel/sensitivity policy are invalid");
  if (policy.maxBundles !== undefined && (!Number.isSafeInteger(policy.maxBundles) || policy.maxBundles < 1)) throw new Error("Notification maxBundles must be a positive integer");
  const acknowledged = new Set(policy.acknowledgedIntentIds ?? []);
  const groups = new Map<string, NotificationIntent[]>();
  for (const intent of intents) {
    if (!intent.id.trim() || !intent.ownerId.trim() || !intent.dedupeKey.trim() || !intent.title.trim()) continue;
    if (acknowledged.has(intent.id) || intent.sourceRefs.length === 0 || intent.sourceRefs.some((ref) => !ref.trim())) continue;
    if (!Number.isFinite(intent.sensitivityRank) || intent.sensitivityRank < 0) continue;
    if (policy.quiet && intent.severity !== "critical") continue;
    const key = `${intent.ownerId}:${intent.dedupeKey}`;
    groups.set(key, [...(groups.get(key) ?? []), intent]);
  }
  const routed: RoutedNotification[] = [];
  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.id.localeCompare(b.id));
    const first = ordered[0];
    if (!first) continue;
    const maxSensitivity = Math.max(...ordered.map((intent) => intent.sensitivityRank));
    const minimized = maxSensitivity > policy.maxSensitivityRank;
    const link = minimized ? undefined : safeDeepLink(first.deepLink);
    routed.push(Object.freeze({ ownerId: first.ownerId, intentIds: Object.freeze(ordered.map((intent) => intent.id)), channel: policy.channel, title: minimized ? "Command Center needs your attention" : first.title, body: minimized ? "Open Command Center to view the protected details." : first.body, ...(link ? { deepLink: link } : {}), minimized, severity: first.severity }));
  }
  routed.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.ownerId.localeCompare(b.ownerId) || a.intentIds[0]!.localeCompare(b.intentIds[0]!));
  const limit = policy.maxBundles ?? routed.length;
  return Object.freeze(routed.slice(0, limit));
}
