export interface OrchestrationChoice {
  readonly sequence: number;
  readonly kind: "scheduler" | "policy" | "model" | "provider" | "time" | "random" | "retry" | "conflict" | "barrier" | "recovery";
  readonly inputHash: string;
  readonly outputHash: string;
  readonly chosenValue: string;
}

export function validateReplayLog(choices: readonly OrchestrationChoice[]): void {
  let sequence = 1;
  for (const choice of choices) {
    if (choice.sequence !== sequence) throw new Error(`Replay sequence gap at ${sequence}`);
    if (!choice.inputHash.trim() || !choice.outputHash.trim()) throw new Error("Replay choice requires input/output hash");
    sequence += 1;
  }
}

export function replayChoices(choices: readonly OrchestrationChoice[]): readonly string[] {
  validateReplayLog(choices);
  return Object.freeze(choices.map((choice) => choice.chosenValue));
}
