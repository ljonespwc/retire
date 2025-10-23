-- Migration: Add user_id to conversation_states for linking conversations to users
-- This enables permanent scenario storage and user-specific conversation history

-- Add user_id column (nullable for now since existing conversations don't have it)
ALTER TABLE conversation_states
ADD COLUMN user_id UUID REFERENCES users(id);

-- Create index for faster user-specific queries
CREATE INDEX idx_conversation_states_user_id ON conversation_states(user_id);

-- Add comment for documentation
COMMENT ON COLUMN conversation_states.user_id IS 'Links conversation to authenticated user for scenario storage';
