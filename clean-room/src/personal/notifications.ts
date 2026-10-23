export type NotificationSeverity = "critical" | "high" | "normal" | "low";

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
}

export interface RoutedNotification {
  readonly intentIds: readonly string[];
  readonly channel: string;
  readonly title: string;
  readonly body: string;
  readonly deepLink?: string;
  readonly minimized: boolean;
}

export function routeNotifications(intents: readonly NotificationIntent[], policy: NotificationChannelPolicy): readonly RoutedNotification[] {
  if (!policy.enabled) return Object.freeze([]);
  const groups = new Map<string, NotificationIntent[]>();
  for (const intent of intents) {
    if (intent.sourceRefs.length === 0) continue;
    if (policy.quiet && intent.severity !== "critical") continue;
    groups.set(intent.dedupeKey, [...(groups.get(intent.dedupeKey) ?? []), intent]);
  }
  const routed: RoutedNotification[] = [];
  for (const group of groups.values()) {
    const first = group[0];
    if (!first) continue;
    const maxSensitivity = Math.max(...group.map((intent) => intent.sensitivityRank));
    const minimized = maxSensitivity > policy.maxSensitivityRank;
    routed.push(Object.freeze({ intentIds: Object.freeze(group.map((intent) => intent.id)), channel: policy.channel, title: minimized ? "Command Center needs your attention" : first.title, body: minimized ? "Open Command Center to view the protected details." : first.body, ...(minimized || !first.deepLink ? {} : { deepLink: first.deepLink }), minimized }));
  }
  return Object.freeze(routed);
}
