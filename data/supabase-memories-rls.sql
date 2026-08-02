/**
 * Run in Supabase SQL Editor if using SUPABASE_KEY (publishable/anon).
 * Service role key bypasses RLS and does not need these policies.
 */
-- ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memories_select_policy" ON memories;
DROP POLICY IF EXISTS "memories_insert_policy" ON memories;
DROP POLICY IF EXISTS "memories_delete_policy" ON memories;

CREATE POLICY "memories_select_policy"
ON memories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "memories_insert_policy"
ON memories FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "memories_delete_policy"
ON memories FOR DELETE
TO anon, authenticated
USING (true);
