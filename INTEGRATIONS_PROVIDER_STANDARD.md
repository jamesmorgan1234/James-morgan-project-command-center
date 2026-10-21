# Command Center Integrations provider standard

## Provider versus account

A provider/platform is not an account.

Command Center must support any number of independently connected accounts, profiles, pages, channels, stores, workspaces, or identities under the same provider. Every account receives its own connection ID, permissions, authorization state, health state, sync cursor/history, webhook endpoint, normalized metrics, revenue records, and reconnect state.

Never collapse multiple accounts on the same provider into one connection merely for convenience. Portfolio/project/platform rollups belong in Analytics after account-level ingestion.

## Verified versus unavailable data

Only provider-reported or otherwise verified source data may populate normalized metrics. Unsupported or unavailable values remain `N/A`; never estimate or invent subscriber/follower counts, engagement, or revenue merely to fill the UI.

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

LinkedIn is not part of the canonical ten-platform VeloClip set.

For Facebook, VeloClip uses a Facebook Page. A personal Facebook profile may own/administer that Page but remains a separate personal identity and must not be treated as the VeloClip publishing destination.

The ten-platform set is a provider target list, not a claim that all ten accounts are currently connected or authenticated. Each real account is added only when verified/authorized.

## Multiple VeloClip accounts

If VeloClip has multiple accounts/channels on one platform, create one connection per account. Example:

- YouTube → VeloClip Main
- YouTube → VeloClip Clips
- TikTok → VeloClip Main
- TikTok → another verified VeloClip account

Analytics may later calculate provider totals and VeloClip-wide totals from those independent account records while preserving source-level evidence.
