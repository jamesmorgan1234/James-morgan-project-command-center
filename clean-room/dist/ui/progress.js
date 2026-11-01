export function verifiedProgress(completed, total, denominatorVerified) {
    if (!denominatorVerified || total === undefined)
        return Object.freeze({ kind: "na", label: "N/A", reason: "unverified_or_unknown_denominator" });
    if (!Number.isSafeInteger(total) || total <= 0)
        return Object.freeze({ kind: "na", label: "N/A", reason: "invalid_denominator" });
    if (completed === undefined || !Number.isSafeInteger(completed) || completed < 0 || completed > total)
        return Object.freeze({ kind: "na", label: "N/A", reason: "invalid_or_unverified_completed_count" });
    return Object.freeze({ kind: "percent", completed, total, percent: Math.round((completed / total) * 100) });
}
export const STATUS_PRESENTATION = Object.freeze({
    active: Object.freeze({ label: "Active", tone: "green" }),
    live: Object.freeze({ label: "Live", tone: "green" }),
    in_progress: Object.freeze({ label: "In Progress", tone: "yellow" }),
    planning: Object.freeze({ label: "Planning", tone: "cyan" }),
    ready: Object.freeze({ label: "Ready", tone: "green" }),
    queued: Object.freeze({ label: "Queued", tone: "muted" }),
    blocked: Object.freeze({ label: "Blocked", tone: "red" }),
    complete: Object.freeze({ label: "Complete", tone: "green" }),
    healthy: Object.freeze({ label: "Healthy", tone: "green" }),
    needs_owner: Object.freeze({ label: "Needs Owner", tone: "red" })
});
//# sourceMappingURL=progress.js.map