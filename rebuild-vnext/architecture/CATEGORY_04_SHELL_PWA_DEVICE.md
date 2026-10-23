# Category 4 — Shell / UX / PWA / Device Foundation

Status: **IMPLEMENTED BUT VISUAL-REFERENCE VERIFICATION PENDING**.

## Implemented now

- isolated VNext web shell; no production root cutover;
- private-by-default signed-out shell exposing no project/business/financial/Agent/Brain data;
- phone-first portrait layout, safe-area padding, native vertical scrolling, no horizontal overflow;
- near-black/orange-gold design-token foundation and clipped sci-fi geometry consistent with the locked written visual spec;
- reduced-motion support;
- truthful value helper: verified zero = 0, unknown/unverified = N/A;
- PWA manifest with stable VNext ID/scope and references to the locked approved Command Center icon assets;
- service worker uses network-first navigation with cached shell fallback;
- service worker does not cache API/Supabase data;
- shell is noindex/nofollow/noarchive while private;
- identity provider remains intentionally unconnected until the identity/provider phase authorizes it.

## Verification blocker

The repository preserves the four literal approved screenshot filenames and SHA-256 hashes in `COMMAND_CENTER_APPROVED_VISUAL_SPEC.md`, but not the image bytes. Project/Library search also did not recover files named `3369.png`, `3370.png`, `3372.png`, or `3373.png`.

Therefore G8 exact pixel/geometry comparison cannot honestly be marked complete yet. This does not authorize substituting old V7 UI as the visual authority.

## Gates already passing

Private-shell exposure, truthful value fallback, noindex, safe viewport, visual token contract, scroll contract, PWA cache boundary, and Categories 1–3 regression tests.
