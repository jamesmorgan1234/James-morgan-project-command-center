/**
 * Design templates: artwork and chevron safe areas, screen and section
 * templates, blocked and offline states, and the component gallery.
 */
export function artworkSafeArea(insets) {
    for (const [edge, value] of Object.entries(insets)) {
        if (!Number.isFinite(value) || value < 0)
            throw new Error(`Artwork safe area ${edge} must be nonnegative`);
    }
    return Object.freeze({ ...insets });
}
export function chevronSafeArea(size) {
    if (!Number.isFinite(size) || size <= 0)
        throw new Error("A chevron requires a positive size");
    return Object.freeze({ size, clear: size * 2 });
}
export function screenTemplate(name, sections) {
    if (!name.trim())
        throw new Error("A screen template requires a name");
    if (sections.length === 0)
        throw new Error("A screen template requires sections");
    if (new Set(sections).size !== sections.length)
        throw new Error("Screen template sections must be unique");
    return Object.freeze({ name, sections: Object.freeze([...sections]) });
}
export function sectionTemplate(kind, allowed) {
    if (!allowed.includes(kind))
        throw new Error(`Unknown section template: ${kind}`);
    return kind;
}
export function blockedStateTemplate(reason, action) {
    if (!reason.trim())
        throw new Error("A blocked state requires a reason");
    if (!action.trim())
        throw new Error("A blocked state requires an action");
    return Object.freeze({ reason, action, tone: "blocked" });
}
export function offlineStateTemplate(lastSyncedAt) {
    if (Number.isNaN(Date.parse(lastSyncedAt)))
        throw new Error("An offline state requires a valid sync timestamp");
    return Object.freeze({ lastSyncedAt, tone: "offline" });
}
export function componentGallery(names) {
    if (names.length === 0)
        throw new Error("The component gallery requires components");
    if (new Set(names).size !== names.length)
        throw new Error("Gallery components must be unique");
    return Object.freeze([...names]);
}
//# sourceMappingURL=templates.js.map