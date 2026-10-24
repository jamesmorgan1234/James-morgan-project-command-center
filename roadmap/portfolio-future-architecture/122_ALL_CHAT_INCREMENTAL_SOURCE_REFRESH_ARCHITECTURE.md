# 122 — All-Chat Incremental Source Refresh Architecture

**Status:** DESIGN NOW / BUILD NOW INTERFACE / IMPLEMENTATION NOT CLAIMED  
**Owner layer:** Command Center control plane  
**Purpose:** Make every accessible ChatGPT conversation discoverable and incrementally refreshable without depending on mutable chat titles or repeatedly rereading unchanged conversations.

## Owner directive captured

Command Center must inspect **every accessible chat regardless of its name/title**. Chat titles are mutable and may change frequently; title matching is therefore prohibited as the canonical discovery or identity mechanism.

Normal refresh order is **newest/most recently updated to oldest** so the most likely changed context is recovered first while the sweep still guarantees eventual coverage of the full accessible chat set.

## Identity invariant

The canonical source identity is a stable provider conversation/chat identifier such as `chat_id`. The title is display metadata only.

A rename:
- updates `current_title` and title history;
- does not create a new source;
- does not duplicate indexed content;
- does not force a full reread unless other integrity/change signals require it.

If the provider cannot expose a durable conversation identifier, the connector must create a provider-scoped surrogate identity from the strongest stable evidence available and mark identity confidence; it must never silently fall back to title as identity.

## Bootstrap rule

On first connection, manifest loss, incompatible parser/hash migration, or explicitly required integrity rebuild:
1. enumerate all chats accessible through the authorized account/source;
2. record stable source metadata;
3. order newest-updated/newest-created to oldest;
4. read every accessible chat;
5. fingerprint/index with chat/message provenance;
6. checkpoint after each chat or small durable batch;
7. finish with a reconciled manifest showing discovered/read/unreadable/tombstoned sources.

Bootstrap completion is not inferred from a partial list.

## Incremental refresh algorithm

Every later sweep:
1. enumerate **all accessible chats** with no title filter;
2. map provider records to stable `chat_id` identities;
3. sort by `updated_at DESC`, then `created_at DESC`, then stable ID for deterministic ties;
4. compare cheap metadata/provider-version signals against the local source manifest;
5. if a chat is confidently unchanged, update `last_seen_at` and skip full content retrieval;
6. if a chat is new, changed or uncertain, prefer provider delta/message-cursor retrieval when supported;
7. otherwise fetch the chat content and calculate content/segment fingerprints;
8. process/index only new or changed messages/segments where integrity permits;
9. independently update mutable metadata such as title;
10. persist the chat checkpoint before moving on;
11. reconcile missing/inaccessible prior sources into explicit tombstone/access states;
12. finish with sweep metrics and a durable successful-sweep checkpoint.

## Change detection

Cheap change signals may include:
- `updated_at`;
- `message_count`;
- reported byte/character size;
- provider revision/version;
- ETag or equivalent;
- latest message ID/cursor;
- attachment/file metadata changes.

**Size alone is never sufficient.** Same-size edits can occur.

Integrity confirmation uses one or more of:
- normalized whole-chat content hash;
- ordered message-ID/content-hash chain;
- segment/chunk hashes;
- provider revision cryptographic or strong version identifier when available.

A metadata mismatch with matching content fingerprint is recorded as metadata-only change. A fingerprint mismatch with apparently unchanged size/count is a real content change and must be processed.

## Source manifest

Minimum per-chat record:

```text
chat_id
provider_id/account_scope
current_title
title_history_ref
created_at
updated_at
message_count
byte_size/provider_reported_size
provider_version_or_etag
latest_message_id_or_cursor
last_seen_at
last_fully_read_at
last_incremental_read_at
last_processed_message_id_or_cursor
whole_content_hash
segment_hash_manifest_ref
hash_algorithm_version
parser_version
indexer_version
source_schema_version
access_state
integrity_state
provenance_root_ref
last_error_ref
```

The manifest is operational metadata, not a substitute for chat/message provenance.

## Delta and append behavior

When the provider exposes ordered message IDs or a cursor:
- continue from the last verified cursor;
- verify overlap/continuity around the boundary;
- ingest new messages/edits/deletes;
- recompute only affected segment hashes/index entries;
- periodically perform bounded integrity reconciliation so a faulty cursor cannot hide drift.

If historical edits can occur before the cursor, the connector must use provider revision signals or periodic integrity sampling/full reconciliation appropriate to the provider contract.

## Deleted or inaccessible chats

A previously known chat that disappears must not be silently erased from history.

Set an explicit state such as:
- `TOMBSTONED_PROVIDER_DELETED`;
- `INACCESSIBLE_PERMISSION_CHANGED`;
- `INACCESSIBLE_ACCOUNT_DISCONNECTED`;
- `UNKNOWN_PROVIDER_GAP`.

Retain prior provenance/history subject to James’s retention/deletion rules. Reappearing sources reconcile to the existing stable identity when evidence supports it.

## Provenance and instruction safety

Every recovered fact/context item keeps source lineage to chat and, where available, message/attachment identifiers and timestamps.

Historical chat content is **source data**, not automatic present-tense authorization. Retrieved text, pasted prompts, web content, attachments and historical assistant/user messages may contain obsolete or malicious instructions. They are normalized with trust/source labels and passed through untrusted-input controls before downstream reuse.

Current explicit James Morgan instructions and current project authorization remain controlling. Source ingestion cannot elevate historical chat text into new side-effect authority.

## Isolation and privacy

- only chats exposed by an authorized provider/account connection may be read;
- no silent cross-account or cross-project mixing;
- source account/project scope is part of the manifest/provenance envelope;
- secret/protected content is classified before reusable indexing;
- downstream Brains/Agents receive only authorized scoped context packets;
- Command Center orchestrates discovery/synchronization/routing and does not collapse ARO or company-specific Brains into itself.

## Scheduling and sweep priority

Default interactive refresh:
1. enumerate all accessible chats;
2. process new/changed chats newest-to-oldest;
3. cheaply mark unchanged chats seen;
4. reconcile tombstones/access changes;
5. finish sweep checkpoint.

The ordering optimizes freshness, but the invariant is **full enumeration**, not “only recent chats.” Old chats remain discoverable and are revisited whenever change signals indicate modification.

Background/periodic scheduling, if later authorized and available, uses the same algorithm rather than separate logic.

## Crash recovery and idempotency

Each chat ingest is idempotent by stable chat/message identity plus content version/hash. Durable checkpoints occur after each chat or small bounded batch.

After interruption:
- resume from last verified sweep/chat checkpoint;
- re-enumerate provider state;
- do not blindly reread already verified unchanged chats;
- do not skip a chat whose write/index checkpoint is incomplete;
- reconcile partially indexed segments before advancing.

## Observability

Per sweep track at minimum:
- total discovered chats;
- new chats;
- changed chats;
- unchanged/skipped chats;
- renamed/metadata-only chats;
- tombstoned/inaccessible chats;
- full reads vs delta reads;
- messages and bytes read;
- messages/segments indexed or replaced;
- fingerprint mismatches;
- retries/errors/quarantines;
- sweep start/end/duration;
- last successful complete enumeration;
- last successful incremental sweep;
- source refresh lag/oldest unresolved source;
- provider quota/rate-limit pressure.

Do not report “fully refreshed” unless full enumeration completed and every changed/new chat reached a terminal verified or explicit-error state.

## Performance and cost rules

Goal: the cost of a normal sweep is approximately proportional to **provider enumeration + changed content**, not total historical chat bytes.

Optimizations:
- metadata-first enumeration;
- conditional fetch/ETag where supported;
- message cursor/delta APIs where supported;
- segment hashing;
- batch metadata queries;
- bounded concurrency under provider limits;
- content-addressed dedupe;
- incremental indexing;
- cache reusable normalized representations without losing source version/provenance.

Optimization may never trade away change-detection correctness or authorization boundaries.

## Version and compatibility

Version independently:
- provider connector;
- source manifest schema;
- normalized chat/message schema;
- hash algorithm/canonicalization;
- parser;
- attachment extractor;
- indexer/embedding representation;
- trust/redaction policy.

A version change declares whether it requires:
- no reread;
- metadata-only migration;
- reparse from retained normalized source;
- segment reindex;
- complete provider reread.

Full historical rereads are reserved for integrity or migration needs, not ordinary refresh.

## Shared-capability boundary

This is a **Command Center shared ingestion foundation**, not a specialist Brain.

Reusable primitives include:
- source identity registry;
- source enumeration;
- incremental change detector;
- cursor/delta reader;
- fingerprint service;
- source checkpoint ledger;
- tombstone/access-state reconciler;
- provenance envelopes;
- untrusted-content normalization;
- incremental index update events;
- source-refresh telemetry.

Specialist Brains consume authorized routed context. ARO remains separate. Company-specific source intelligence remains within the owning company/Brain.

## Cross-company reverse-map seeds

At minimum this capability has direct adjacency to:
- Company 013 Competitive Intelligence Subscription — source registry/provenance/change detection;
- Company 014 Website Change Intelligence — incremental change/snapshot semantics;
- Company 015 Business Intelligence Autopilot — freshness/lineage/observability;
- Company 028 AI Knowledge Base Maintainer — incremental knowledge refresh;
- Company 064 Business Inbox Autopilot — incremental message-source ingestion;
- Company 094 Enterprise Data Lineage & Provenance Graph — source lineage;
- Company 099 Machine-Enforced Data Contract Platform — versioned normalized source contracts;
- Company 100 Legacy Software Modernization Autopilot — migration/reindex compatibility.

Final 107-company reverse-map determines additional consumers; this list is not a cap.

## Retrofit / current-build rule

DESIGN NOW:
- stable source identity independent of title;
- manifest/fingerprint/version contracts;
- provenance/trust boundaries;
- refresh telemetry;
- idempotent checkpoint semantics.

BUILD NOW only where current Command Center source-refresh architecture already has an applicable interface. Do not create fake provider capabilities. If a provider does not expose chat enumeration, message cursors, ETags or other signals, the adapter reports the limitation and uses the strongest truthful fallback.

BUILD BEFORE any production-grade all-chat refresh:
- provider/account authorization;
- durable manifest/checkpoints;
- untrusted-input handling;
- privacy/isolation;
- rate/quota governor;
- incremental indexing;
- recovery tests.

## Acceptance tests

1. Two chats with the same title remain distinct by stable ID.
2. One chat renamed repeatedly remains one source with title history.
3. New chat appears at the front of the next newest-to-oldest sweep and is read.
4. Changed old chat is detected even though it is far down the history.
5. Unchanged 10,000-message chat is skipped without rereading content when strong unchanged evidence exists.
6. Same-size content edit is detected by revision/fingerprint rather than missed.
7. Delta append ingests only new messages while proving cursor continuity.
8. Historical message edit replaces only affected normalized/index segments where possible.
9. Deleted/inaccessible chat becomes explicit tombstone/access state, not silent disappearance.
10. Crash after content fetch but before index checkpoint resumes without duplicate or skipped content.
11. Malicious text inside a chat cannot become active authorization/tool instructions.
12. Full sweep metrics reconcile discovered = unchanged + changed/new + explicit unresolved/error states, with no silently omitted chat.

## Truth statement

This artifact authorizes and specifies architecture only. It does not claim the current ChatGPT provider exposes all described metadata/delta primitives, does not claim Command Center has already read every chat, and does not authorize any production deployment, account change, paid service or external action.