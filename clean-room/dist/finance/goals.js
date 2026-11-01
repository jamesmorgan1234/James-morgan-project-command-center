export function goalProgress(goal) {
    if (!Number.isSafeInteger(goal.targetCents) || goal.targetCents <= 0)
        throw new Error("Financial goal target must be positive safe cents");
    if (goal.currentCents === undefined)
        return Object.freeze({ kind: "na", label: "N/A", reason: "current_value_unknown" });
    if (!Number.isSafeInteger(goal.currentCents))
        throw new Error("Financial goal current value must be safe cents");
    return Object.freeze({ kind: "percent", percent: Math.max(0, Math.min(100, Math.round((goal.currentCents / goal.targetCents) * 100))), currentCents: goal.currentCents, targetCents: goal.targetCents });
}
//# sourceMappingURL=goals.js.map