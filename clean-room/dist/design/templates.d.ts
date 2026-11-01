/**
 * Design templates: artwork and chevron safe areas, screen and section
 * templates, blocked and offline states, and the component gallery.
 */
export interface Insets {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
}
export declare function artworkSafeArea(insets: Insets): Insets;
export declare function chevronSafeArea(size: number): {
    readonly size: number;
    readonly clear: number;
};
export declare function screenTemplate(name: string, sections: readonly string[]): {
    readonly name: string;
    readonly sections: readonly string[];
};
export declare function sectionTemplate(kind: string, allowed: readonly string[]): string;
export declare function blockedStateTemplate(reason: string, action: string): {
    readonly reason: string;
    readonly action: string;
    readonly tone: "blocked";
};
export declare function offlineStateTemplate(lastSyncedAt: string): {
    readonly lastSyncedAt: string;
    readonly tone: "offline";
};
export declare function componentGallery(names: readonly string[]): readonly string[];
