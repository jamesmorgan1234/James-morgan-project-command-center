import { type AnalyticsEventEnvelope, type AnalyticsEventName, type AnalyticsSource, type AnalyticsValue } from "./measurement-schema.js";
export type TelemetryConsent = "granted" | "denied" | "unknown";
export type TelemetryClass = "product_analytics" | "essential_reliability";
export type TelemetryDropReason = "consent_not_granted" | "invalid_event" | "unsafe_payload";
export interface TelemetryDeliveryResult {
    status: "delivered" | "dropped";
    reason?: TelemetryDropReason;
    errors?: readonly string[];
}
export type AnalyticsSink = (event: AnalyticsEventEnvelope) => void | Promise<void>;
export declare const isPrivacySafeProperty: (key: string, value: AnalyticsValue) => boolean;
export declare const sanitizeAnalyticsProperties: (eventName: AnalyticsEventName, properties: Readonly<Record<string, AnalyticsValue>> | undefined) => Readonly<Record<string, AnalyticsValue>> | undefined;
export declare const minimizeAnalyticsEvent: (event: AnalyticsEventEnvelope, telemetryClass: TelemetryClass) => AnalyticsEventEnvelope;
export declare const containsUnsafeAnalyticsPayload: (event: AnalyticsEventEnvelope) => boolean;
export declare class PrivacySafeAnalyticsEmitter {
    private readonly clientSink;
    private readonly serverSink;
    constructor(clientSink: AnalyticsSink, serverSink: AnalyticsSink);
    emit(event: AnalyticsEventEnvelope, consent: TelemetryConsent, telemetryClass?: TelemetryClass): Promise<TelemetryDeliveryResult>;
}
export interface SafeTelemetryContext {
    eventName: AnalyticsEventName;
    eventId: string;
    occurredAt: string;
    source: AnalyticsSource;
    sessionId: string;
    journeyId: string;
    projectId?: string;
    integrationId?: string;
    runId?: string;
    expertId?: string;
    dotId?: string;
    supportCaseId?: string;
}
export declare const captureSafeErrorEvent: (context: SafeTelemetryContext, failureCode: string, properties?: Readonly<Record<string, AnalyticsValue>>) => AnalyticsEventEnvelope;
export declare const captureSafePerformanceEvent: (context: SafeTelemetryContext, durationMs: number, properties?: Readonly<Record<string, AnalyticsValue>>) => AnalyticsEventEnvelope;
