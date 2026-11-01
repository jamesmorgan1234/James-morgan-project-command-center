export type MessageCatalog = Readonly<Record<string, string>>;
export type LocalizationCatalogs = Readonly<Record<string, MessageCatalog>>;
export interface LocalizedMessage {
    readonly key: string;
    readonly value: string;
    readonly requestedLocale: string;
    readonly resolvedLocale: string;
    readonly usedFallback: boolean;
}
export declare function canonicalizeLocale(locale: string): string;
export declare class LocalizationRegistry {
    #private;
    constructor(defaultLocale: string, catalogs: LocalizationCatalogs);
    defaultLocale(): string;
    supportedLocales(): readonly string[];
    hasLocale(locale: string): boolean;
    resolve(requestedLocale: string, key: string): LocalizedMessage;
}
