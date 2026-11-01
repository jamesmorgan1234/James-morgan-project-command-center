import type { AiRouteRegistry } from "../brain/providers.js";
import type { AgencyExecutorRegistry } from "../agency/registry.js";
import type { SchedulerControlPlane } from "../agency/scheduler.js";
import type { FinancialProviderRegistry } from "../finance/providers.js";
import type { BookRegistry } from "../books/registry.js";
import type { SpecialistRegistry } from "../specialists/registry.js";
import type { MetricRegistry } from "../analytics/metrics.js";
import type { PlatformProfileRegistry } from "../social/profiles.js";
import { type SocialConnection } from "../social/connections.js";
import type { RuntimeSurfaceReader } from "./assembly.js";
export interface StandardSurfaceReaderOptions {
    readonly sourceRef: string;
    readonly observedAt: string;
    readonly now?: () => string;
    readonly socialRequiredScopes?: readonly string[];
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
export declare function createStandardSurfaceReaders(options: StandardSurfaceReaderOptions): readonly RuntimeSurfaceReader[];
