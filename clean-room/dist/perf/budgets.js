/** Performance budgets: navigation, render, query, requests, lists, pagination, N+1 and cache invalidation. */
export function assertBudget(label, actual, budget) {
    if (!Number.isFinite(actual) || actual < 0)
        throw new Error(`${label} measurement must be nonnegative`);
    if (actual > budget)
        throw new Error(`${label} budget exceeded`);
}
export function navigationBudget(ms) {
    assertBudget("Navigation", ms, 300);
}
export function renderBudget(ms) {
    assertBudget("Screen render", ms, 100);
}
export function queryBudget(ms) {
    assertBudget("Data query", ms, 200);
}
export function requestBudget(count) {
    if (!Number.isSafeInteger(count) || count < 0)
        throw new Error("A request count must be a nonnegative integer");
    if (count > 12)
        throw new Error("Unnecessary network requests exceed the maximum");
}
export function listStrategy(items) {
    if (!Number.isSafeInteger(items) || items < 0)
        throw new Error("A list size must be a nonnegative integer");
    if (items > 1000)
        throw new Error("Large lists require virtualization");
    return items > 50 ? "virtualized" : "plain";
}
export function page(items, pageSize, index) {
    if (!Number.isSafeInteger(pageSize) || pageSize < 1)
        throw new Error("A page size must be positive");
    if (!Number.isSafeInteger(index) || index < 0)
        throw new Error("A page index must be nonnegative");
    const start = index * pageSize;
    if (start >= items.length)
        throw new Error("Page is out of range");
    return Object.freeze(items.slice(start, start + pageSize));
}
export function assertNoNPlusOne(queries, items) {
    if (items > 0 && queries > 1)
        throw new Error("N+1 data queries are not permitted");
}
export function invalidateCache(key, rules) {
    const rule = rules[key];
    if (!rule)
        throw new Error(`No cache invalidation rule for ${key}`);
    return rule;
}
//# sourceMappingURL=budgets.js.map