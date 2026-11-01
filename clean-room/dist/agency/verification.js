export function validateIndependentVerification(request) {
    if (request.evidenceRefs.length === 0)
        throw new Error("Verification requires evidence");
    if (["high", "critical"].includes(request.risk) && request.executorId === request.verifierId)
        throw new Error("High-risk task requires independent verifier");
}
//# sourceMappingURL=verification.js.map