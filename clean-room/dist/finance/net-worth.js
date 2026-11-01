export function calculateNetWorth(ownerId, accounts, currency = "USD") {
    let assets = 0;
    let liabilities = 0;
    const unknown = [];
    for (const account of accounts.filter((candidate) => candidate.ownerId === ownerId)) {
        if (account.balance.state === "unknown") {
            unknown.push(account.id);
            continue;
        }
        if (account.balance.currency !== currency) {
            unknown.push(account.id);
            continue;
        }
        if (account.liability)
            liabilities += Math.abs(account.balance.cents);
        else
            assets += account.balance.cents;
    }
    return Object.freeze({ ownerId, currency, knownAssetsCents: assets, knownLiabilitiesCents: liabilities, knownNetWorthCents: assets - liabilities, unknownAccountIds: Object.freeze(unknown), complete: unknown.length === 0 });
}
export function calculatePositionNetWorth(ownerId, positions, currency = "USD", asOf = new Date().toISOString()) {
    if (!ownerId.trim())
        throw new Error("Net worth ownerId is required");
    if (!/^[A-Z]{3}$/.test(currency))
        throw new Error("Net worth currency must be three uppercase letters");
    if (!Number.isFinite(Date.parse(asOf)))
        throw new Error("Net worth asOf must be an ISO-compatible timestamp");
    let assets = 0;
    let liabilities = 0;
    const verified = [];
    const verifiedZero = [];
    const pending = [];
    const stale = [];
    const unavailable = [];
    const sourceDates = {};
    const seen = new Set();
    for (const position of positions.filter((candidate) => candidate.ownerId === ownerId)) {
        if (seen.has(position.accountId))
            throw new Error(`Multiple current positions for financial account: ${position.accountId}`);
        seen.add(position.accountId);
        sourceDates[position.accountId] = position.valuationDate;
        if (position.value.state === "unavailable") {
            unavailable.push(position.accountId);
            continue;
        }
        if (position.value.currency !== currency) {
            unavailable.push(position.accountId);
            continue;
        }
        if (position.value.state === "pending") {
            pending.push(position.accountId);
            continue;
        }
        if (position.value.state === "stale") {
            stale.push(position.accountId);
            continue;
        }
        verified.push(position.accountId);
        if (position.value.cents === 0)
            verifiedZero.push(position.accountId);
        if (position.positionClass === "liability")
            liabilities += Math.abs(position.value.cents);
        else
            assets += position.value.cents;
    }
    return Object.freeze({
        ownerId,
        currency,
        asOf,
        verifiedAssetsCents: assets,
        verifiedLiabilitiesCents: liabilities,
        verifiedNetWorthCents: assets - liabilities,
        verifiedAccountIds: Object.freeze(verified),
        verifiedZeroAccountIds: Object.freeze(verifiedZero),
        pendingAccountIds: Object.freeze(pending),
        staleAccountIds: Object.freeze(stale),
        unavailableAccountIds: Object.freeze(unavailable),
        sourceDatesByAccount: Object.freeze(sourceDates),
        complete: pending.length === 0 && stale.length === 0 && unavailable.length === 0
    });
}
//# sourceMappingURL=net-worth.js.map