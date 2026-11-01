export type MoneyValue = Readonly<{
    state: "known";
    cents: number;
    currency: string;
}> | Readonly<{
    state: "unknown";
    reason: string;
}>;
export declare function knownMoney(cents: number, currency?: string): MoneyValue;
export declare function unknownMoney(reason: string): MoneyValue;
export declare function addKnownMoney(values: readonly MoneyValue[]): MoneyValue;
