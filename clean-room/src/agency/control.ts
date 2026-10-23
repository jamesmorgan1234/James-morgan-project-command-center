export interface RunControlState {
  readonly runId: string;
  readonly generation: number;
  readonly paused: boolean;
  readonly stopped: boolean;
  readonly killScope?: "run" | "project" | "agency";
}

export function requestPause(control: RunControlState): RunControlState {
  if (control.stopped) throw new Error("Stopped run cannot be paused");
  return Object.freeze({ ...control, paused: true });
}

export function requestStop(control: RunControlState, killScope: "run" | "project" | "agency" = "run"): RunControlState {
  return Object.freeze({ ...control, stopped: true, paused: false, killScope, generation: control.generation + 1 });
}

export function assertLateResponseAllowed(control: RunControlState, responseGeneration: number): void {
  if (control.stopped) throw new Error("Stopped run rejects late worker response");
  if (responseGeneration !== control.generation) throw new Error("Late worker response generation is stale");
}
