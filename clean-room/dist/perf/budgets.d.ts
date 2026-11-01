/** Performance budgets: navigation, render, query, requests, lists, pagination, N+1 and cache invalidation. */
export declare function assertBudget(label: string, actual: number, budget: number): void;
export declare function navigationBudget(ms: number): void;
export declare function renderBudget(ms: number): void;
export declare function queryBudget(ms: number): void;
export declare function requestBudget(count: number): void;
export declare function listStrategy(items: number): "plain" | "virtualized";
export declare function page<T>(items: readonly T[], pageSize: number, index: number): readonly T[];
export declare function assertNoNPlusOne(queries: number, items: number): void;
export declare function invalidateCache(key: string, rules: Readonly<Record<string, string>>): string;
