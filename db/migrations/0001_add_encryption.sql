-- Modify proposals table
ALTER TABLE proposals
DROP COLUMN startup_name,
DROP COLUMN pitch,
ADD COLUMN encrypted_data TEXT NOT NULL,
ADD COLUMN iv TEXT NOT NULL;

-- Modify vc_votes table
ALTER TABLE vc_votes
DROP COLUMN vc_persona,
DROP COLUMN vote,
DROP COLUMN reasoning,
ADD COLUMN encrypted_data TEXT NOT NULL,
ADD COLUMN iv TEXT NOT NULL; 