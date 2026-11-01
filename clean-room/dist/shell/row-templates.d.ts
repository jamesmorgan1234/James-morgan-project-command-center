/** Row templates, state templates, visual regression and safe areas. */
export interface RowTemplate {
    readonly kind: "project" | "active" | "next_up";
    readonly title: string;
    readonly meta: string;
}
export declare function projectRow(title: string, status: string): RowTemplate;
export declare function activeRow(title: string, focus: string): RowTemplate;
export declare function nextUpRow(title: string, rank: number): RowTemplate;
export declare function loadingStateTemplate(label: string, skeletons: number): string;
export declare function emptyStateTemplate(message: string, action: string): string;
export declare function errorStateTemplate(message: string, retryable: boolean): string;
export declare function visualRegressionSuite(screens: readonly string[]): readonly string[];
export declare function safeAreaHandling(insets: {
    readonly top: number;
    readonly bottom: number;
}): void;
