/**
 * Design templates: artwork and chevron safe areas, screen and section
 * templates, blocked and offline states, and the component gallery.
 */

export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export function artworkSafeArea(insets: Insets): Insets {
  for (const [edge, value] of Object.entries(insets)) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`Artwork safe area ${edge} must be nonnegative`);
  }
  return Object.freeze({ ...insets });
}

export function chevronSafeArea(size: number): { readonly size: number; readonly clear: number } {
  if (!Number.isFinite(size) || size <= 0) throw new Error("A chevron requires a positive size");
  return Object.freeze({ size, clear: size * 2 });
}

export function screenTemplate(name: string, sections: readonly string[]): { readonly name: string; readonly sections: readonly string[] } {
  if (!name.trim()) throw new Error("A screen template requires a name");
  if (sections.length === 0) throw new Error("A screen template requires sections");
  if (new Set(sections).size !== sections.length) throw new Error("Screen template sections must be unique");
  return Object.freeze({ name, sections: Object.freeze([...sections]) });
}

export function sectionTemplate(kind: string, allowed: readonly string[]): string {
  if (!allowed.includes(kind)) throw new Error(`Unknown section template: ${kind}`);
  return kind;
}

export function blockedStateTemplate(reason: string, action: string): { readonly reason: string; readonly action: string; readonly tone: "blocked" } {
  if (!reason.trim()) throw new Error("A blocked state requires a reason");
  if (!action.trim()) throw new Error("A blocked state requires an action");
  return Object.freeze({ reason, action, tone: "blocked" as const });
}

export function offlineStateTemplate(lastSyncedAt: string): { readonly lastSyncedAt: string; readonly tone: "offline" } {
  if (Number.isNaN(Date.parse(lastSyncedAt))) throw new Error("An offline state requires a valid sync timestamp");
  return Object.freeze({ lastSyncedAt, tone: "offline" as const });
}

export function componentGallery(names: readonly string[]): readonly string[] {
  if (names.length === 0) throw new Error("The component gallery requires components");
  if (new Set(names).size !== names.length) throw new Error("Gallery components must be unique");
  return Object.freeze([...names]);
}
