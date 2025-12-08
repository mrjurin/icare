-- Add unique partial index to ensure only one SPR voter version is active at a time
-- This constraint enforces that only one row can have is_active = true
CREATE UNIQUE INDEX IF NOT EXISTS "spr_voter_versions_one_active_idx" 
ON "spr_voter_versions" ("is_active") 
WHERE "is_active" = true;
