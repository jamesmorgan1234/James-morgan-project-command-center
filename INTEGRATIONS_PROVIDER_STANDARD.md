# Command Center Integrations provider standard

## Provider versus account

A provider/platform is not an account.

Command Center must support any number of independently connected accounts, profiles, pages, channels, stores, workspaces, mailboxes, or identities under the same provider. Every account receives its own connection ID, permissions, authorization state, health state, sync cursor/history, webhook endpoint, normalized records/metrics, revenue records, and reconnect state.

Never collapse multiple accounts on the same provider into one connection merely for convenience. Portfolio/project/platform rollups belong in Analytics after account-level ingestion.

Examples:

- YouTube → VeloClip Main
- YouTube → a second verified channel
- Gmail → one company mailbox
- Gmail → another company mailbox
- Outlook → one Microsoft mailbox
- Yahoo Mail → personal mailbox

Each is a separate connection even when several use the same provider.

## Verified versus unavailable data

Only provider-reported or otherwise verified source data may populate normalized metrics or records. Unsupported or unavailable values remain `N/A`; never estimate or invent subscriber/follower counts, engagement, revenue, or mailbox state merely to fill the UI.

Normalized social/content/revenue keys include, where available:

- `social.followers`
- `social.subscribers`
- `content.views`
- `content.likes`
- `content.comments`
- `content.shares`
- `content.watch_time_seconds`
- `revenue.reported`

Provider-specific fields may be added without changing these canonical rollup keys.

## Email / mailbox integration standard

Email providers are first-class Integrations providers. A mailbox is an account-level connection and must remain separate from other mailboxes on the same provider.

Current target provider families include:

- Yahoo Mail — personal mailbox target
- Gmail / Google Workspace — separate company/business mailboxes
- Microsoft Outlook / Microsoft 365 — separate Microsoft mailboxes
- Proton Mail — target for the Fanvue-related mailbox if that is verified as the mailbox in use

Actual mailbox addresses, provider identities, and connection methods are not guessed. Each mailbox is added only after the real account is identified and authorized.

Canonical normalized email records should support, where the provider exposes them:

- message ID
- thread/conversation ID
- sender
- recipients
- subject
- received/sent timestamp
- unread/read state
- labels/folders
- safe snippet/preview
- attachment metadata
- project/business mapping

Full email bodies and attachment content are more sensitive than ordinary account metrics. They should be read/stored only under an explicit mailbox-content permission; connection metadata, headers, snippets, counts, and status may use narrower read scopes where supported.

Multiple company Gmail/Outlook mailboxes must never be silently merged into one mailbox. Cross-mailbox summaries belong in Analytics/Brain after source-level normalization.

## VeloClip canonical target platform set

The canonical VeloClip ten-platform target set is:

1. YouTube
2. TikTok
3. Instagram
4. Facebook Page
5. Snapchat
6. Pinterest
7. X
8. Threads
9. Rumble
10. Dailymotion

LinkedIn is not part of the canonical ten-platform VeloClip publishing set, but **LinkedIn is an additional valid Command Center social provider** because there is a real LinkedIn account to integrate when authorized.

Fanvue is also an additional valid Command Center provider for its verified account-level audience/subscriber/revenue data where the connected provider interface exposes it. It is not automatically treated as one of VeloClip's ten publishing targets.

For Facebook, VeloClip uses a Facebook Page. A personal Facebook profile may own/administer that Page but remains a separate personal identity and must not be treated as the VeloClip publishing destination.

The ten-platform set is a provider target list, not a claim that all ten accounts are currently connected or authenticated. Each real account is added only when verified/authorized.

## Multiple VeloClip accounts

If VeloClip has multiple accounts/channels on one platform, create one connection per account. Example:

- YouTube → VeloClip Main
- YouTube → VeloClip Clips
- TikTok → VeloClip Main
- TikTok → another verified VeloClip account

Analytics may later calculate provider totals and VeloClip-wide totals from those independent account records while preserving source-level evidence.
