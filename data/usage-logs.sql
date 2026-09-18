-- Usage tracking table for Anthropic cost monitoring.
-- Run in the Supabase SQL Editor.
-- Server inserts use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- Authenticated users can SELECT only their own rows via the cookie client.
-- App-level cap: each signed-in user is limited to $0.25 lifetime Anthropic spend.

CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  agent_type text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL DEFAULT 0,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_logs_user_id_created_at_idx
  ON usage_logs (user_id, created_at DESC);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_logs_select_own" ON usage_logs;

CREATE POLICY "usage_logs_select_own"
ON usage_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);
