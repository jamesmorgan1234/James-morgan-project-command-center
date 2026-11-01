export interface ZonedCivilTime {
    readonly year: number;
    readonly month: number;
    readonly day: number;
    readonly hour: number;
    readonly minute: number;
    readonly timeZone: string;
}
export type CivilTimeDisambiguation = "earlier" | "later";
/** Resolves a wall-clock time without silently inventing skipped or ambiguous DST instants. */
export declare function resolveZonedCivilTime(civil: ZonedCivilTime, disambiguation?: CivilTimeDisambiguation): string;
