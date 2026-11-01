export function validateReplayLog(choices) {
    let sequence = 1;
    for (const choice of choices) {
        if (choice.sequence !== sequence)
            throw new Error(`Replay sequence gap at ${sequence}`);
        if (!choice.inputHash.trim() || !choice.outputHash.trim())
            throw new Error("Replay choice requires input/output hash");
        sequence += 1;
    }
}
export function replayChoices(choices) {
    validateReplayLog(choices);
    return Object.freeze(choices.map((choice) => choice.chosenValue));
}
//# sourceMappingURL=replay.js.map