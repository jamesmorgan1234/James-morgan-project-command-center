-- COMMAND CENTER: separate, $0 owner-requested cloud-only public documentation receipts.
-- Never impersonate the Windows worker or reuse the canonical PC tool queue.
-- No business operations, paid tools, generic browsing, or production-release action.
CREATE TABLE public.command_center_cloud_public_docs_receipts (
  job_id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id text NOT NULL,
  company_id text NOT NULL,
  brain_key text NOT NULL,
  url text NOT NULL CHECK (length(url) BETWEEN 16 AND 700),
  input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  state text NOT NULL DEFAULT 'claimed' CHECK (state IN ('claimed','completed','uncertain')),
  result jsonb,
  output_hash text CHECK (output_hash IS NULL OR output_hash ~ '^[a-f0-9]{64}$'),
  commit_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT cc_cloud_docs_project_identity FOREIGN KEY (owner_id,project_id)
    REFERENCES public.command_center_project_profiles(owner_id,project_id) ON DELETE RESTRICT,
  CONSTRAINT cc_cloud_docs_completed_receipt CHECK (
    (state='completed' AND result IS NOT NULL AND output_hash IS NOT NULL
       AND commit_id IS NOT NULL AND completed_at IS NOT NULL)
    OR (state<>'completed' AND result IS NULL AND output_hash IS NULL
       AND commit_id IS NULL AND completed_at IS NULL)),
  CONSTRAINT cc_cloud_docs_safety_flags CHECK (
    result IS NULL OR (
      result->'paidUsageAuthorized'='false'::jsonb AND
      result->'companyBuildStarted'='false'::jsonb AND
      result->'generalCompanyExecution'='false'::jsonb AND
      result->'executed'='false'::jsonb))
);
CREATE UNIQUE INDEX cc_cloud_docs_only_one_active_per_owner
 ON public.command_center_cloud_public_docs_receipts(owner_id)
 WHERE state='claimed';
CREATE INDEX cc_cloud_docs_owner_project_history
 ON public.command_center_cloud_public_docs_receipts(owner_id,project_id,created_at DESC);
ALTER TABLE public.command_center_cloud_public_docs_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_center_cloud_public_docs_receipts FORCE ROW LEVEL SECURITY;
CREATE POLICY cc_owner_can_read_own_cloud_docs_receipts
 ON public.command_center_cloud_public_docs_receipts FOR SELECT TO authenticated
 USING(owner_id=(SELECT auth.uid()) AND (SELECT public.is_command_center_authorized()));
REVOKE ALL ON public.command_center_cloud_public_docs_receipts FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.command_center_cloud_public_docs_receipts TO authenticated;
COMMENT ON TABLE public.command_center_cloud_public_docs_receipts IS
 'COMMAND CENTER owner-requested, allowlisted $0 cloud public-documents only; immutable owner evidence, separate from PC native worker and general job execution.';
