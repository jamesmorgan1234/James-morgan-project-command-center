import { connectionIsLive, assessSocialConnection } from "./connections.js";
import { assertDraftPublishReady } from "./drafts.js";
function ts(v, l) { const p = Date.parse(v); if (!Number.isFinite(p))
    throw new Error(`${l} must be an ISO-compatible timestamp`); return p; }
function refs(v, l, one = false) { if ((one && !v.length) || v.some(x => !x.trim()))
    throw new Error(`${l} cannot contain blank values`); return Object.freeze([...new Set(v.map(x => x.trim()))]); }
export class SocialContentCalendar {
    #e = new Map();
    upsert(x) { if (!x.id.trim() || !x.ownerId.trim() || !x.brandId.trim() || !x.accountId.trim() || !x.draftId.trim())
        throw new Error("content calendar identity/scope/draft are required"); ts(x.scheduledAt, "content calendar scheduledAt"); const sourceRefs = refs(x.sourceRefs, "content calendar source refs", true); const c = this.#e.get(x.id); if (c && (c.ownerId !== x.ownerId || c.brandId !== x.brandId || c.accountId !== x.accountId || c.draftId !== x.draftId))
        throw new Error("content calendar identity cannot be silently retargeted"); const f = Object.freeze({ ...x, sourceRefs }); this.#e.set(x.id, f); return f; }
    list(ownerId, brandId, accountId) { return Object.freeze([...this.#e.values()].filter(x => x.ownerId === ownerId && (brandId === undefined || x.brandId === brandId) && (accountId === undefined || x.accountId === accountId))); }
}
export class PublishLedger {
    #i = new Map();
    #fp = new Map();
    #k = new Map();
    #r = new Map();
    #f = new Map();
    prepare(i, d, c, now) { if (i.state !== "prepared")
        throw new Error("new publish intent must start prepared"); const fp = JSON.stringify(i); if (this.#i.has(i.id)) {
        if (this.#fp.get(i.id) !== fp)
            throw new Error("publish intent identity collision");
        return this.#i.get(i.id);
    } assertDraftPublishReady(d); if (!i.authorizationRef.trim())
        throw new Error("publishing requires explicit protected-action authorization evidence"); if (i.ownerId !== d.ownerId || i.brandId !== d.brandId || i.accountId !== d.intendedAccountId || i.draftId !== d.id)
        throw new Error("publish intent must target the exact approved draft/account identity"); if (c.accountId !== i.accountId || !connectionIsLive(c, i.requiredScopes, now))
        throw new Error("intended social account is not verified live with required scopes"); const prior = this.#k.get(i.idempotencyKey); if (prior && prior !== i.id)
        throw new Error("duplicate publish idempotency key"); const f = Object.freeze({ ...i, requiredScopes: Object.freeze([...i.requiredScopes]) }); this.#i.set(i.id, f); this.#fp.set(i.id, fp); this.#k.set(i.idempotencyKey, i.id); return f; }
    transition(id, expected, next) { const c = this.#i.get(id); if (!c || c.state !== expected)
        throw new Error("publish state mismatch"); const a = { prepared: ["scheduled", "submitting", "failed", "cancelled"], scheduled: ["submitting", "failed", "cancelled"], submitting: ["published", "uncertain", "failed"], uncertain: ["published", "failed"], published: [], cancelled: [], failed: [] }; if (!a[c.state].includes(next))
        throw new Error(`invalid publish transition ${c.state} -> ${next}`); const u = Object.freeze({ ...c, state: next }); this.#i.set(id, u); return u; }
    recordReceipt(r) { const c = this.#i.get(r.intentId); if (!c || c.accountId !== r.accountId)
        throw new Error("receipt does not match exact intended account"); if (!r.externalPublicationId.trim() || !r.providerRef.trim())
        throw new Error("publication receipt requires provider evidence"); if (r.canonicalPostUrl !== undefined && !r.canonicalPostUrl.trim())
        throw new Error("canonical post URL cannot be blank"); ts(r.publishedAt, "publishedAt"); const p = this.#r.get(r.intentId); if (p && (p.externalPublicationId !== r.externalPublicationId || p.canonicalPostUrl !== r.canonicalPostUrl))
        throw new Error("conflicting publication receipts require reconciliation"); this.#r.set(r.intentId, Object.freeze({ ...r })); if (c.state === "submitting" || c.state === "uncertain")
        this.transition(r.intentId, c.state, "published"); }
    recordFailure(id, reason) { if (!reason.trim())
        throw new Error("failed publish reason is required"); const c = this.#i.get(id); if (!c)
        throw new Error("unknown publish intent"); if (this.#r.has(id))
        throw new Error("confirmed publication cannot be overwritten by failure"); this.#f.set(id, reason.trim()); return c.state === "failed" ? c : this.transition(id, c.state, "failed"); }
    receipt(id) { return this.#r.get(id); }
    history(ownerId) { return Object.freeze([...this.#i.values()].filter(i => i.ownerId === ownerId).map(i => { const r = this.#r.get(i.id), f = this.#f.get(i.id); return Object.freeze({ intentId: i.id, accountId: i.accountId, draftId: i.draftId, state: i.state, ...(r ? { externalPublicationId: r.externalPublicationId, ...(r.canonicalPostUrl ? { canonicalPostUrl: r.canonicalPostUrl } : {}), publishedAt: r.publishedAt } : {}), ...(f ? { failedReason: f } : {}), evidenceRefs: Object.freeze(r ? [r.providerRef] : f ? [`failure:${i.id}`] : []) }); })); }
}
export class EvidenceBackedPublishLedger {
    #i = new Map();
    #fp = new Map();
    #k = new Map();
    #a = new Map();
    #r = new Map();
    #effects = new Map();
    #fail = new Map();
    prepare(i, d, c, now, maxAge) {
        if (i.state !== "prepared")
            throw new Error("new publish intent must start prepared");
        const fp = JSON.stringify(i);
        if (this.#i.has(i.id)) {
            if (this.#fp.get(i.id) !== fp)
                throw new Error("publish intent identity collision");
            return this.#i.get(i.id);
        }
        assertDraftPublishReady(d);
        const n = ts(now, "publish preparation now"), a = ts(i.authorizationObservedAt, "authorization observedAt"), e = ts(i.authorizationExpiresAt, "authorization expiresAt");
        if (!i.id.trim() || !i.authorizationRef.trim() || !i.idempotencyKey.trim() || !i.profileKey.trim())
            throw new Error("publish intent identity, authorization, idempotency, and profile are required");
        if (!Number.isSafeInteger(i.draftVersion) || i.draftVersion < 1 || !Number.isSafeInteger(i.profileVersion) || i.profileVersion < 1)
            throw new Error("publish draft/profile versions must be positive");
        if ((i.workflowId === undefined) !== (i.workflowOrdinal === undefined))
            throw new Error("publish workflow id and ordinal must be supplied together");
        if (i.workflowId !== undefined && !i.workflowId.trim())
            throw new Error("publish workflow id cannot be blank");
        if (i.workflowOrdinal !== undefined && (!Number.isSafeInteger(i.workflowOrdinal) || i.workflowOrdinal < 1))
            throw new Error("publish workflow ordinal must be positive");
        if (a > n || e <= n || e <= a)
            throw new Error("publish authorization must be current and unexpired");
        if (i.authorizationAccountId !== i.accountId)
            throw new Error("protected-action authorization must name the exact intended account");
        if (i.ownerId !== d.ownerId || i.brandId !== d.brandId || i.accountId !== d.intendedAccountId || i.draftId !== d.id || i.draftVersion !== d.version || i.draftContentHash !== d.contentHash)
            throw new Error("publish intent must bind the exact approved draft revision/content/account");
        if (c.ownerId !== i.ownerId || c.canonicalAccountId !== i.accountId)
            throw new Error("social connection does not match exact owner/account");
        if (!assessSocialConnection(c, i.requiredScopes, now, maxAge).live)
            throw new Error("intended social account is not verified live with required scopes");
        const p = this.#k.get(i.idempotencyKey);
        if (p && p !== i.id)
            throw new Error("publish idempotency key is already bound");
        if (i.workflowId && i.workflowOrdinal && i.workflowOrdinal > 1) {
            const first = [...this.#i.values()].find(x => x.workflowId === i.workflowId && x.workflowOrdinal === 1 && x.ownerId === i.ownerId && x.brandId === i.brandId);
            if (!first || first.state !== "published")
                throw new Error("one-before-many requires the first workflow publication to be confirmed");
        }
        const f = Object.freeze({ ...i, requiredScopes: refs(i.requiredScopes, "publish required scopes") });
        this.#i.set(i.id, f);
        this.#fp.set(i.id, fp);
        this.#k.set(i.idempotencyKey, i.id);
        return f;
    }
    schedule(id, at) { const i = this.req(id); if (i.state !== "prepared")
        throw new Error("only prepared publish intent can be scheduled"); ts(at, "publish schedule"); return this.put(i, { ...i, state: "scheduled", scheduledAt: at }); }
    startAttempt(a) { const i = this.req(a.intentId); if (i.state !== "prepared" && i.state !== "scheduled")
        throw new Error("publish attempt cannot start until the prior uncertain outcome is reconciled"); if (a.accountId !== i.accountId || a.idempotencyKey !== i.idempotencyKey)
        throw new Error("publish attempt must use exact account and idempotency key"); if (!a.attemptId.trim() || !a.providerRequestRef.trim())
        throw new Error("publish attempt requires stable provider request evidence"); const at = ts(a.observedAt, "attempt observedAt"); if (this.#a.has(a.attemptId))
        throw new Error("duplicate publish attempt id"); if (a.state !== "submitted" || at < ts(i.authorizationObservedAt, "authorization time") || at >= ts(i.authorizationExpiresAt, "authorization expiry"))
        throw new Error("publish authorization stale or attempt state invalid"); if (i.scheduledAt && at < ts(i.scheduledAt, "scheduledAt"))
        throw new Error("publish schedule not due"); const f = Object.freeze({ ...a }); this.#a.set(a.attemptId, f); this.put(i, { ...i, state: "submitting" }); return f; }
    markAttemptUnknown(id, responseRef, at) { const a = this.#a.get(id); if (!a)
        throw new Error("unknown publish attempt"); if (!responseRef.trim())
        throw new Error("unknown publish outcome requires response evidence"); ts(at, "unknown outcome observedAt"); const i = this.req(a.intentId); if (i.state !== "submitting")
        throw new Error("only submitting publication can become uncertain"); this.#a.set(id, Object.freeze({ ...a, state: "unknown", responseRef, observedAt: at })); return this.put(i, { ...i, state: "uncertain" }); }
    reconcileReceipt(r) { const i = this.req(r.intentId); if (r.accountId !== i.accountId || r.idempotencyKey !== i.idempotencyKey)
        throw new Error("publication receipt does not match exact account/idempotency binding"); if (!r.externalPublicationId.trim() || !r.providerRef.trim())
        throw new Error("publication receipt requires external effect and provider evidence"); if (r.canonicalPostUrl !== undefined && !r.canonicalPostUrl.trim())
        throw new Error("canonical post URL cannot be blank"); ts(r.publishedAt, "publishedAt"); const ev = refs(r.evidenceRefs, "publication receipt evidence", true), prior = this.#r.get(r.intentId); if (prior) {
        if (prior.externalPublicationId !== r.externalPublicationId || prior.accountId !== r.accountId || prior.canonicalPostUrl !== r.canonicalPostUrl)
            throw new Error("conflicting publication receipts indicate more than one possible public effect");
        return prior;
    } const ek = JSON.stringify([r.accountId, r.externalPublicationId]), bound = this.#effects.get(ek); if (bound && bound !== r.intentId)
        throw new Error("public effect is already attributed to another intent"); if (!["submitting", "uncertain", "published"].includes(i.state))
        throw new Error("publication receipt is inconsistent with current state"); const f = Object.freeze({ ...r, evidenceRefs: ev }); this.#r.set(r.intentId, f); this.#effects.set(ek, r.intentId); if (i.state !== "published")
        this.put(i, { ...i, state: "published" }); return f; }
    recordFailure(id, evidenceRef, reason = "provider_publish_failed") { const i = this.req(id); if (this.#r.has(id))
        throw new Error("confirmed public effect cannot be overwritten by failure"); if (!evidenceRef.trim() || !reason.trim())
        throw new Error("publish failure requires evidence and reason"); if (!["submitting", "uncertain", "prepared", "scheduled"].includes(i.state))
        throw new Error("publish failure transition is invalid"); this.#fail.set(id, { reason: reason.trim(), evidenceRef: evidenceRef.trim() }); return this.put(i, { ...i, state: "failed" }); }
    cancel(id) { const i = this.req(id); if (i.state !== "prepared" && i.state !== "scheduled")
        throw new Error("dispatched publication requires reconciliation, not cancellation"); return this.put(i, { ...i, state: "cancelled" }); }
    reschedule(id, at, now) { const i = this.req(id); if (i.state !== "scheduled" || ts(at, "schedule") < ts(now, "now"))
        throw new Error("invalid reschedule"); return this.put(i, { ...i, scheduledAt: at }); }
    intent(id) { return this.#i.get(id); }
    receipt(id) { return this.#r.get(id); }
    history(ownerId) { return Object.freeze([...this.#i.values()].filter(i => i.ownerId === ownerId).map(i => { const r = this.#r.get(i.id), f = this.#fail.get(i.id); return Object.freeze({ intentId: i.id, accountId: i.accountId, draftId: i.draftId, state: i.state, ...(r ? { externalPublicationId: r.externalPublicationId, ...(r.canonicalPostUrl ? { canonicalPostUrl: r.canonicalPostUrl } : {}), publishedAt: r.publishedAt } : {}), ...(f ? { failedReason: f.reason } : {}), evidenceRefs: Object.freeze(r ? [...r.evidenceRefs] : f ? [f.evidenceRef] : []) }); })); }
    req(id) { const i = this.#i.get(id); if (!i)
        throw new Error("unknown publish intent"); return i; }
    put(c, n) { const f = Object.freeze({ ...n, requiredScopes: Object.freeze([...n.requiredScopes]) }); this.#i.set(c.id, f); return f; }
}
//# sourceMappingURL=publishing.js.map