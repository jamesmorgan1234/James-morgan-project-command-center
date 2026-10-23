import { known } from "../data/canonical.js";
import type { AiRouteRegistry } from "../brain/providers.js";
import type { AgencyExecutorRegistry } from "../agency/registry.js";
import type { SchedulerControlPlane } from "../agency/scheduler.js";
import type { FinancialProviderRegistry } from "../finance/providers.js";
import type { BookRegistry } from "../books/registry.js";
import type { SpecialistRegistry } from "../specialists/registry.js";
import type { MetricRegistry } from "../analytics/metrics.js";
import type { PlatformProfileRegistry } from "../social/profiles.js";
import { connectionIsLive, type SocialConnection } from "../social/connections.js";
import type { RuntimeEvidenceRef } from "./snapshot.js";
import type { RuntimeSurfaceReader } from "./assembly.js";

export interface StandardSurfaceReaderOptions {
  readonly sourceRef: string;
  readonly observedAt: string;
  readonly brainRoutes?: AiRouteRegistry;
  readonly agencyExecutors?: AgencyExecutorRegistry;
  readonly agencyScheduler?: SchedulerControlPlane;
  readonly financeProviders?: FinancialProviderRegistry;
  readonly books?: BookRegistry;
  readonly specialists?: SpecialistRegistry;
  readonly analyticsMetrics?: MetricRegistry;
  readonly socialProfiles?: PlatformProfileRegistry;
  readonly socialConnections?: readonly SocialConnection[];
}

function evidence(options: StandardSurfaceReaderOptions): readonly RuntimeEvidenceRef[] {
  return Object.freeze([Object.freeze({ source: options.sourceRef, observedAt: options.observedAt })]);
}

function reader(key: string, label: string, read: RuntimeSurfaceReader["read"]): RuntimeSurfaceReader {
  return Object.freeze({ key, label, read });
}

export function createStandardSurfaceReaders(options: StandardSurfaceReaderOptions): readonly RuntimeSurfaceReader[] {
  if (!options.sourceRef.trim() || !Number.isFinite(Date.parse(options.observedAt))) throw new Error("surface reader provenance and observedAt are required");
  const refs = evidence(options);
  const readers: RuntimeSurfaceReader[] = [];

  if (options.brainRoutes) readers.push(reader("brain", "Brain", () => {
    const routes = options.brainRoutes!.list();
    const enabledHealthy = routes.filter((route) => route.enabled && route.health !== "unavailable" && route.quotaAvailable !== false);
    const freeHealthy = enabledHealthy.filter((route) => route.cost === "free");
    return Object.freeze({ availability: enabledHealthy.length > 0 ? "available" as const : "unavailable" as const, summary: known(`${routes.length} AI route${routes.length === 1 ? "" : "s"} registered; ${enabledHealthy.length} enabled/healthy; ${freeHealthy.length} enabled/healthy free.`), evidence: refs });
  }));

  if (options.agencyExecutors || options.agencyScheduler) readers.push(reader("agency", "Agency", () => {
    const executors = options.agencyExecutors?.list() ?? [];
    const usable = executors.filter((executor) => executor.enabled && executor.health !== "unavailable");
    const leadership = options.agencyScheduler?.current();
    const leadershipCurrent = leadership !== undefined && Date.parse(leadership.expiresAt) > Date.parse(options.observedAt);
    return Object.freeze({ availability: usable.length > 0 ? "available" as const : "unavailable" as const, summary: known(`${executors.length} executor${executors.length === 1 ? "" : "s"} registered; ${usable.length} enabled and not unavailable; current scheduler leadership record: ${leadershipCurrent ? "yes" : "no"}. This does not assert any worker is actively executing.`), evidence: refs });
  }));

  if (options.financeProviders) readers.push(reader("finance", "Finance", () => {
    const providers = options.financeProviders!.list();
    const connected = providers.filter((provider) => provider.enabled && provider.connectionState === "connected" && provider.consentState === "granted" && provider.health !== "unavailable");
    const availability = connected.length > 0 ? "available" as const : providers.length > 0 ? "disconnected" as const : "unavailable" as const;
    return Object.freeze({ availability, summary: known(`${providers.length} financial provider${providers.length === 1 ? "" : "s"} registered; ${connected.length} connected with granted consent and non-unavailable health. No balance is implied by provider connectivity.`), evidence: refs });
  }));

  if (options.books) readers.push(reader("books", "Books", () => {
    const books = options.books!.list();
    return Object.freeze({ availability: "available" as const, summary: known(`${books.length} canonical book record${books.length === 1 ? "" : "s"} registered.`), evidence: refs });
  }));

  if (options.specialists) readers.push(reader("specialists", "Specialists", () => {
    const profiles = options.specialists!.list();
    return Object.freeze({ availability: "available" as const, summary: known(`${profiles.length} specialist project profile${profiles.length === 1 ? "" : "s"} registered.`), evidence: refs });
  }));

  if (options.analyticsMetrics) readers.push(reader("analytics", "Analytics", () => {
    const definitions = options.analyticsMetrics!.list();
    return Object.freeze({ availability: "available" as const, summary: known(`${definitions.length} metric definition${definitions.length === 1 ? "" : "s"} registered. This does not assert current metric values.`), evidence: refs });
  }));

  if (options.socialProfiles || options.socialConnections) readers.push(reader("social", "Social & Communications", () => {
    const profiles = options.socialProfiles?.list() ?? [];
    const connections = options.socialConnections ?? [];
    const liveConnections = connections.filter((connection) => connectionIsLive(connection, []));
    const availability = liveConnections.length > 0 ? "available" as const : connections.length > 0 || profiles.length > 0 ? "disconnected" as const : "unavailable" as const;
    return Object.freeze({ availability, summary: known(`${profiles.length} platform compliance profile${profiles.length === 1 ? "" : "s"} registered; ${connections.length} account connection record${connections.length === 1 ? "" : "s"}; ${liveConnections.length} currently live by connection evidence.`), evidence: refs });
  }));

  return Object.freeze(readers);
}
