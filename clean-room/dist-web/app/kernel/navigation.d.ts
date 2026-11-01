/**
 * Navigation and kernel invariants.
 *
 * Route restoration, Android and browser Back contracts, nested-detail and
 * expanded-section Back, per-route scroll memory, soft navigation, no shared
 * mutable globals, no competing event loops and a kernel version identifier.
 */
export interface NavigationState {
    readonly detailStack: readonly string[];
    readonly expandedSections: readonly string[];
}
export declare function restoreRoute(saved: {
    readonly route: string;
} | null, fallback: string): string;
export type BackAction = "close_detail" | "collapse_section" | "navigate" | "exit";
export interface BackOutcome {
    readonly action: BackAction;
    readonly state: NavigationState;
}
export declare function androidBack(state: NavigationState, canExit: boolean): BackOutcome;
export declare function browserBack(history: readonly string[], index: number): {
    readonly route: string;
    readonly index: number;
};
export declare function nestedDetailBack(stack: readonly string[]): {
    readonly stack: readonly string[];
    readonly handled: boolean;
};
export declare function expandedSectionBack(sections: readonly string[]): {
    readonly sections: readonly string[];
    readonly handled: boolean;
};
export declare function rememberScroll(store: Readonly<Record<string, number>>, route: string, offset: number): Readonly<Record<string, number>>;
export declare function assertSoftNavigation(navigation: {
    readonly fullPageReload: boolean;
}): void;
export declare function assertNoSharedMutableGlobals(globals: readonly string[]): void;
export declare function assertSingleEventLoop(loops: readonly string[]): void;
export declare function kernelVersion(version: string): string;
