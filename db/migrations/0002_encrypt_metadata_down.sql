-- Revert vc_votes table changes
ALTER TABLE vc_votes
ADD COLUMN metadata JSONB;
-- Set default empty JSON object for existing rows
UPDATE vc_votes
SET metadata = '{}';
-- Make metadata NOT NULL
ALTER TABLE vc_votes
ALTER COLUMN metadata
SET NOT NULL;
-- Drop the encrypted columns
ALTER TABLE vc_votes DROP COLUMN encrypted_metadata,
  DROP COLUMN metadata_iv;