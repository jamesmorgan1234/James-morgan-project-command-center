import type { ApprovedScreenKey } from "./visual-references.js";
import type { PrimitiveKind } from "./primitives.js";
export interface ScreenStructureFixture {
    readonly screen: ApprovedScreenKey;
    readonly requiredRegions: readonly string[];
    readonly requiredCardTraits: readonly string[];
}
export declare const APPROVED_SCREEN_FIXTURES: Readonly<Record<ApprovedScreenKey, ScreenStructureFixture>>;
export type RegressionFixtureState = "normal" | "degraded" | "error" | "dense" | "empty" | "stale" | "offline" | "conflict" | "approval";
export interface ComponentRegressionFixture {
    readonly id: string;
    readonly primitive: PrimitiveKind;
    readonly state: RegressionFixtureState;
    readonly deterministicSeed: string;
    readonly fixtureRoute: "/__fixtures";
    readonly providerDependency: "none";
    readonly keyboardCheckRequired: true;
    readonly visualCaptureSupported: true;
}
export declare function componentRegressionFixture(primitive: PrimitiveKind, state: RegressionFixtureState): ComponentRegressionFixture;
export declare const REQUIRED_REGRESSION_STATES: readonly RegressionFixtureState[];
export declare function minimumPrimitiveRegressionFixtures(primitive: PrimitiveKind): readonly ComponentRegressionFixture[];
