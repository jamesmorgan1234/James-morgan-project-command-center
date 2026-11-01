/** Loading strategy: splitting, lazy modules and artwork, images, incremental load, prefetch. */

export function splitEntrypoints(routes: readonly string[]): Readonly<Record<string, string>> {
  if (routes.length === 0) throw new Error("At least one route is required");
  const chunks: Record<string, string> = {};
  for (const route of routes) {
    if (!route.startsWith("/")) throw new Error("Routes must be absolute");
    chunks[route] = `chunk-${route.replace(/\//g, "-")}`;
  }
  return Object.freeze(chunks);
}

export function lazyOptionalModule(name: string, core: boolean): string {
  if (!name.trim()) throw new Error("A module requires a name");
  if (core) throw new Error("Core modules cannot be lazily loaded");
  return `lazy:${name}`;
}

export function lazyArtwork(source: string): string {
  if (source.startsWith("data:") || source.includes("base64")) throw new Error("Artwork must load lazily from a file, not inline");
  return source;
}

export function optimizedImage(image: { readonly width: number; readonly format: string }, displayWidth: number): { readonly width: number; readonly format: string } {
  if (!["webp", "avif"].includes(image.format)) throw new Error("Images must use an optimized format");
  if (image.width > displayWidth * 2) throw new Error("Images must not exceed twice their display width");
  return Object.freeze({ ...image });
}

export function incrementalBatch(total: number, batchSize: number, cursor = 0): { readonly items: number; readonly nextCursor: number | null } {
  if (total < 0 || batchSize < 1 || cursor < 0 || cursor > total) throw new Error("Invalid incremental cursor");
  const items = Math.min(batchSize, total - cursor);
  const nextCursor = cursor + items < total ? cursor + items : null;
  return Object.freeze({ items, nextCursor });
}

export function shouldPrefetch(route: { readonly likely: boolean; readonly costKb: number }): boolean {
  if (route.costKb < 0) throw new Error("Prefetch cost must be nonnegative");
  return route.likely && route.costKb <= 100;
}
