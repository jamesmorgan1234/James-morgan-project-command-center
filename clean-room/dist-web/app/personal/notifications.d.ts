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
export declare function acknowledgeNotification(ownerId: string, intentId: string, acknowledgedAt: string, evidenceRefs: readonly string[]): NotificationAcknowledgement;
export declare function routeNotifications(intents: readonly NotificationIntent[], policy: NotificationChannelPolicy): readonly RoutedNotification[];
