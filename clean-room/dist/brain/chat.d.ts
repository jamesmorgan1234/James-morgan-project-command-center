/** Brain surface: portfolio context, roadmap comparison, compliance scan and guarded routing. */
export declare function buildPortfolioContext(projects: readonly {
    readonly id: string;
    readonly scope: string;
}[], scope: string): readonly string[];
export declare function roadmapComparison(planned: readonly string[], actual: readonly string[]): {
    readonly onTrack: readonly string[];
    readonly behind: readonly string[];
};
export declare function complianceScan(requirements: readonly {
    readonly id: string;
    readonly met: boolean;
}[]): {
    readonly met: number;
    readonly missing: readonly string[];
};
export declare function routeProtectedAction(action: {
    readonly protected: boolean;
}, viaSecurity: boolean): string;
export declare function assertNoSuggestionBypass(path: {
    readonly to: string;
    readonly approved: boolean;
}): void;
export declare function actionPreview(action: {
    readonly consequential: boolean;
    readonly previewed: boolean;
}): void;
