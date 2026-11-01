export interface NavigationSnapshot {
    readonly currentPath: string;
    readonly history: readonly string[];
    readonly scrollByPath: Readonly<Record<string, number>>;
}
export declare class NavigationCoordinator {
    #private;
    constructor(initialPath?: string);
    get currentPath(): string;
    navigate(path: string): void;
    back(fallback?: string): string;
    recordScroll(path: string, offset: number): void;
    restoreScroll(path: string): number;
    snapshot(): NavigationSnapshot;
}
