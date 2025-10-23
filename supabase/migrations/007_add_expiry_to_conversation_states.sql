-- Migration: Add expires_at for automatic cleanup of old conversation states
-- conversation_states is ephemeral (crash recovery only), scenarios is permanent storage

-- Add expires_at column with default of 24 hours from creation
ALTER TABLE conversation_states
ADD COLUMN expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours';

-- Create index for efficient cleanup queries
CREATE INDEX idx_conversation_states_expires ON conversation_states(expires_at);

-- Add comment for documentation
COMMENT ON COLUMN conversation_states.expires_at IS 'Auto-cleanup time (default 24h). Use cleanupOldConversations() to delete expired records.';
