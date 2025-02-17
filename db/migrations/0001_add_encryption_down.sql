-- Revert proposals table changes
ALTER TABLE proposals DROP COLUMN encrypted_data,
  DROP COLUMN iv,
  ADD COLUMN startup_name TEXT NOT NULL,
  ADD COLUMN pitch TEXT NOT NULL;
-- Revert vc_votes table changes
ALTER TABLE vc_votes DROP COLUMN encrypted_data,
  DROP COLUMN iv,
  ADD COLUMN vc_persona TEXT NOT NULL,
  ADD COLUMN vote BOOLEAN NOT NULL,
  ADD COLUMN reasoning TEXT NOT NULL;