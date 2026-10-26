export interface ZonedCivilTime {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly timeZone: string;
}

export type CivilTimeDisambiguation = "earlier" | "later";

function assertIntegerRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label} is out of range`);
}

function assertCivilTime(value: ZonedCivilTime): void {
  assertIntegerRange(value.year, 1970, 9999, "year");
  assertIntegerRange(value.month, 1, 12, "month");
  assertIntegerRange(value.day, 1, 31, "day");
  assertIntegerRange(value.hour, 0, 23, "hour");
  assertIntegerRange(value.minute, 0, 59, "minute");
  if (!value.timeZone.trim()) throw new Error("timeZone is required");
  try { new Intl.DateTimeFormat("en-US", { timeZone: value.timeZone }).format(new Date(0)); }
  catch { throw new Error(`Invalid timeZone: ${value.timeZone}`); }
}

function zonedParts(epochMs: number, timeZone: string): Omit<ZonedCivilTime, "timeZone"> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(epochMs));
  const map = new Map<string, number>(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  const required = (key: string): number => {
    const value = map.get(key);
    if (value === undefined || !Number.isFinite(value)) throw new Error(`Intl formatter omitted ${key}`);
    return value;
  };
  return { year: required("year"), month: required("month"), day: required("day"), hour: required("hour"), minute: required("minute") };
}

function matches(epochMs: number, civil: ZonedCivilTime): boolean {
  const parts = zonedParts(epochMs, civil.timeZone);
  return parts.year === civil.year && parts.month === civil.month && parts.day === civil.day && parts.hour === civil.hour && parts.minute === civil.minute;
}

/** Resolves a wall-clock time without silently inventing skipped or ambiguous DST instants. */
export function resolveZonedCivilTime(civil: ZonedCivilTime, disambiguation?: CivilTimeDisambiguation): string {
  assertCivilTime(civil);
  const nominalUtc = Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour, civil.minute, 0, 0);
  const candidates: number[] = [];
  for (let offsetMinutes = -14 * 60; offsetMinutes <= 14 * 60; offsetMinutes += 1) {
    const candidate = nominalUtc + (offsetMinutes * 60_000);
    if (matches(candidate, civil)) candidates.push(candidate);
  }
  const unique = [...new Set(candidates)].sort((a, b) => a - b);
  if (unique.length === 0) throw new Error("Civil time does not exist in this timezone (DST gap or invalid local date)");
  if (unique.length > 1 && !disambiguation) throw new Error("Civil time is ambiguous in this timezone; explicit earlier/later disambiguation is required");
  const selected = unique.length === 1
    ? unique[0]!
    : disambiguation === "later"
      ? unique[unique.length - 1]!
      : unique[0]!;
  return new Date(selected).toISOString();
}
