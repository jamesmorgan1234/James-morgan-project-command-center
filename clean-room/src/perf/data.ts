/** Data paths: indexes, backpressure, rate limits, device awareness, navigation strategy, launcher art. */

export function assertIndexed(filter: readonly string[], indexes: readonly (readonly string[])[]): void {
  if (filter.length === 0) throw new Error("A query requires at least one filter field");
  const covered = indexes.some((index) => filter.every((field) => index.includes(field)));
  if (!covered) throw new Error("Every query path requires a matching index");
}

export function assertBackpressure(queue: number, max: number): void {
  if (!Number.isSafeInteger(queue) || queue < 0) throw new Error("Queue depth must be nonnegative");
  if (queue > max) throw new Error("Backpressure must be applied to high-volume events");
}

export function rateLimit(attempts: number, limit: number): "allow" | "throttle" {
  if (attempts < 0 || limit < 1) throw new Error("Invalid rate-limit inputs");
  return attempts >= limit ? "throttle" : "allow";
}

export function assertCheapWork(device: { readonly batteryPct: number; readonly cpuPct: number }): void {
  if (device.batteryPct < 15 || device.cpuPct > 80) throw new Error("Work must respect mobile battery and CPU state");
}

export function navigationStrategy(preferNetwork: boolean): "network-first" | "cache-first" {
  return preferNetwork ? "network-first" : "cache-first";
}

export function launcherArt(art: { readonly size: number; readonly hash: string }): { readonly size: number; readonly hash: string } {
  if (![192, 512].includes(art.size)) throw new Error("Launcher art uses approved sizes");
  if (!/^[a-f0-9]{8,}$/.test(art.hash)) throw new Error("Launcher art requires a content hash");
  return Object.freeze({ ...art });
}
