-- Migration: Add source tracking to scenarios table
-- Tracks how scenarios were created (voice, form, manual, api) and links to original conversation

-- Add source column with constraint
ALTER TABLE scenarios
ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('voice', 'form', 'manual', 'api'));

-- Add conversation_id for audit trail (nullable since not all scenarios come from voice)
ALTER TABLE scenarios
ADD COLUMN conversation_id TEXT;

-- Create index for finding scenarios by conversation
CREATE INDEX idx_scenarios_conversation_id ON scenarios(conversation_id) WHERE conversation_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN scenarios.source IS 'How this scenario was created: voice (voice conversation), form (manual form), manual (edited), api (programmatic)';
COMMENT ON COLUMN scenarios.conversation_id IS 'Original conversation_id from conversation_states table (for voice-created scenarios, provides audit trail)';
