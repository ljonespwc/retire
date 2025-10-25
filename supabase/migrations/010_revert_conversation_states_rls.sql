-- Revert conversation_states RLS policies
-- This table is accessed server-side by webhooks, not client-side
-- It needs permissive access for webhook operations

-- Drop the user-specific policies
DROP POLICY IF EXISTS "Users can read own conversation states" ON conversation_states;
DROP POLICY IF EXISTS "Users can insert own conversation states" ON conversation_states;
DROP POLICY IF EXISTS "Users can update own conversation states" ON conversation_states;
DROP POLICY IF EXISTS "Users can delete own conversation states" ON conversation_states;

-- Restore permissive policies for server-side webhook access
CREATE POLICY "Enable read access for all users"
  ON conversation_states
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON conversation_states
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON conversation_states
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Enable delete access for all users"
  ON conversation_states
  FOR DELETE
  TO public
  USING (true);

-- Keep RLS enabled (required for policies to work)
ALTER TABLE conversation_states ENABLE ROW LEVEL SECURITY;
