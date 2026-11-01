export type BrowserStartupState = "loading" | "ready" | "degraded" | "failed";
export interface BrowserStartupView {
    readonly generation: number;
    readonly state: BrowserStartupState;
    readonly message: string;
    readonly privateDataAllowed: boolean;
}
export interface StartupTimerHost {
    setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
    clearTimeout(handle: ReturnType<typeof setTimeout>): void;
}
export declare class BrowserStartupCoordinator {
    #private;
    readonly timers: StartupTimerHost;
    constructor(timers?: StartupTimerHost);
    get current(): BrowserStartupView;
    begin(watchdog?: Readonly<{
        timeoutMs: number;
        onTimeout: (state: BrowserStartupView) => void;
    }>): BrowserStartupView;
    degrade(generation: number): BrowserStartupView;
    fail(generation: number): BrowserStartupView;
    commitReady(generation: number): BrowserStartupView;
    canCommit(generation: number): boolean;
}
export declare function isSafeBootstrapMessage(message: string): boolean;
