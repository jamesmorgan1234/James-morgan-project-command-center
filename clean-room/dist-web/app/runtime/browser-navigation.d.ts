export interface CommandCenterHistoryState {
    readonly commandCenter: true;
    readonly locationKey: string;
    readonly scrollY: number;
    readonly sequence: number;
}
export interface BrowserHistoryPort {
    state: unknown;
    length: number;
    scrollRestoration: "auto" | "manual";
    pushState(data: unknown, unused: string, url?: string | URL | null): void;
    replaceState(data: unknown, unused: string, url?: string | URL | null): void;
    back(): void;
}
export interface BrowserLocationPort {
    readonly pathname: string;
    readonly search: string;
}
export interface BrowserScrollPort {
    read(): number;
    restore(offset: number): void;
}
export declare function browserLocationKey(location: BrowserLocationPort): string;
export declare function readCommandCenterHistoryState(value: unknown): CommandCenterHistoryState | undefined;
export declare class BrowserNavigationCoordinator {
    #private;
    readonly history: BrowserHistoryPort;
    readonly location: BrowserLocationPort;
    readonly scroll: BrowserScrollPort;
    constructor(history: BrowserHistoryPort, location: BrowserLocationPort, scroll: BrowserScrollPort);
    initialize(): CommandCenterHistoryState;
    captureCurrent(): CommandCenterHistoryState;
    navigate(path: string): CommandCenterHistoryState;
    back(fallback?: string): "history" | "fallback";
    restore(state: unknown): number;
}
