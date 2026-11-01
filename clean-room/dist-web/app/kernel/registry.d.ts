export interface RegistryRecord {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
}
export declare class Registry<T extends RegistryRecord> {
    #private;
    register(record: T): void;
    replace(record: T, expectedVersion: number): void;
    remove(key: string, expectedVersion: number): T;
    get(key: string): T | undefined;
    list(): readonly T[];
    get size(): number;
}
