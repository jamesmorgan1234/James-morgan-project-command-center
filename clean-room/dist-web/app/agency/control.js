export function requestPause(control) {
    if (control.stopped)
        throw new Error("Stopped run cannot be paused");
    return Object.freeze({ ...control, paused: true });
}
export function requestStop(control, killScope = "run") {
    return Object.freeze({ ...control, stopped: true, paused: false, killScope, generation: control.generation + 1 });
}
export function assertLateResponseAllowed(control, responseGeneration) {
    if (control.stopped)
        throw new Error("Stopped run rejects late worker response");
    if (responseGeneration !== control.generation)
        throw new Error("Late worker response generation is stale");
}
//# sourceMappingURL=control.js.map