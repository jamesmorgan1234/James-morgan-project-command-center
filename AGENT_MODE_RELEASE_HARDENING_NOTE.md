# Agent Mode release hardening

This note records the post-release privilege hardening included with the Agent Mode release source: the internal `command_center_agent_set_updated_at()` trigger helper is not executable by `public`, `anon`, or `authenticated`; `service_role` retains execution for managed runtime use. The matching additive Supabase migration is `20261021232500_agent_mode_trigger_privilege_hardening.sql`.

No Agent Mode behavior, project scope, Work routing, UI behavior, release identity, protected assets, or existing Command Center capability is changed by this hardening.
