/** Data paths: indexes, backpressure, rate limits, device awareness, navigation strategy, launcher art. */
export declare function assertIndexed(filter: readonly string[], indexes: readonly (readonly string[])[]): void;
export declare function assertBackpressure(queue: number, max: number): void;
export declare function rateLimit(attempts: number, limit: number): "allow" | "throttle";
export declare function assertCheapWork(device: {
    readonly batteryPct: number;
    readonly cpuPct: number;
}): void;
export declare function navigationStrategy(preferNetwork: boolean): "network-first" | "cache-first";
export declare function launcherArt(art: {
    readonly size: number;
    readonly hash: string;
}): {
    readonly size: number;
    readonly hash: string;
};
