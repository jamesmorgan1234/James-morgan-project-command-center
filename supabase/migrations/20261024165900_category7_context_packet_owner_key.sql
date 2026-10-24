-- Category 7 corrective preflight prerequisite — owner-scoped unique key for context packet FKs.
-- Branch-only migration. Runs before P7.20 protected preflight.

create unique index if not exists command_center_agency_context_packets_owner_packet_uidx
  on public.command_center_agency_context_packets(owner_id,packet_id);
