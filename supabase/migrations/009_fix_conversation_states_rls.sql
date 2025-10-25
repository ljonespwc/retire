-- Fix RLS policies for conversation_states table
-- Replace overly permissive policies with user-specific policies

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON conversation_states;
DROP POLICY IF EXISTS "Enable insert access for all users" ON conversation_states;
DROP POLICY IF EXISTS "Enable update access for all users" ON conversation_states;
DROP POLICY IF EXISTS "Enable delete access for all users" ON conversation_states;

-- Create user-specific RLS policies
-- Users can only access their own conversation states

CREATE POLICY "Users can read own conversation states"
  ON conversation_states
  FOR SELECT
  TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own conversation states"
  ON conversation_states
  FOR INSERT
  TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own conversation states"
  ON conversation_states
  FOR UPDATE
  TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversation states"
  ON conversation_states
  FOR DELETE
  TO public
  USING ((SELECT auth.uid()) = user_id);

-- Ensure RLS is enabled
ALTER TABLE conversation_states ENABLE ROW LEVEL SECURITY;
