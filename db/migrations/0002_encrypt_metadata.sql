-- Modify vc_votes table to use encrypted metadata
ALTER TABLE vc_votes
ADD COLUMN encrypted_metadata TEXT,
  ADD COLUMN metadata_iv TEXT;
-- Update existing rows with empty encrypted data
UPDATE vc_votes
SET encrypted_metadata = '',
  metadata_iv = '';
-- Make columns NOT NULL after setting defaults
ALTER TABLE vc_votes
ALTER COLUMN encrypted_metadata
SET NOT NULL,
  ALTER COLUMN metadata_iv
SET NOT NULL;
-- Finally drop the old metadata column
ALTER TABLE vc_votes DROP COLUMN metadata;