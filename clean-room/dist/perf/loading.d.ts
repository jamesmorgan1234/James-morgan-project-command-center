/** Loading strategy: splitting, lazy modules and artwork, images, incremental load, prefetch. */
export declare function splitEntrypoints(routes: readonly string[]): Readonly<Record<string, string>>;
export declare function lazyOptionalModule(name: string, core: boolean): string;
export declare function lazyArtwork(source: string): string;
export declare function optimizedImage(image: {
    readonly width: number;
    readonly format: string;
}, displayWidth: number): {
    readonly width: number;
    readonly format: string;
};
export declare function incrementalBatch(total: number, batchSize: number, cursor?: number): {
    readonly items: number;
    readonly nextCursor: number | null;
};
export declare function shouldPrefetch(route: {
    readonly likely: boolean;
    readonly costKb: number;
}): boolean;
