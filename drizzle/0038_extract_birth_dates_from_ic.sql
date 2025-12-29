-- Migration to extract birth dates from IC numbers for SPR voters with missing tarikh_lahir
-- This will significantly reduce the "Unknown" age distribution in reports

-- Create a function to extract birth date from Malaysian IC number
CREATE OR REPLACE FUNCTION extract_birth_date_from_ic(ic_number TEXT)
RETURNS TIMESTAMP
LANGUAGE plpgsql
AS $$
DECLARE
    cleaned_ic TEXT;
    year_part INTEGER;
    month_part INTEGER;
    day_part INTEGER;
    full_year INTEGER;
    birth_date TIMESTAMP;
BEGIN
    -- Return NULL if ic_number is NULL or empty
    IF ic_number IS NULL OR ic_number = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove all non-digit characters
    cleaned_ic := REGEXP_REPLACE(ic_number, '[^0-9]', '', 'g');
    
    -- Malaysian IC should be 12 digits
    IF LENGTH(cleaned_ic) != 12 THEN
        RETURN NULL;
    END IF;
    
    -- Extract year, month, day
    year_part := CAST(SUBSTRING(cleaned_ic, 1, 2) AS INTEGER);
    month_part := CAST(SUBSTRING(cleaned_ic, 3, 2) AS INTEGER);
    day_part := CAST(SUBSTRING(cleaned_ic, 5, 2) AS INTEGER);
    
    -- Validate month and day
    IF month_part < 1 OR month_part > 12 THEN
        RETURN NULL;
    END IF;
    
    IF day_part < 1 OR day_part > 31 THEN
        RETURN NULL;
    END IF;
    
    -- Determine century: if YY is 00-30, assume 2000-2030, otherwise 1900-1999
    IF year_part <= 30 THEN
        full_year := 2000 + year_part;
    ELSE
        full_year := 1900 + year_part;
    END IF;
    
    -- Create the date
    BEGIN
        birth_date := MAKE_TIMESTAMP(full_year, month_part, day_part, 0, 0, 0);
        RETURN birth_date;
    EXCEPTION
        WHEN OTHERS THEN
            -- Invalid date (e.g., Feb 30)
            RETURN NULL;
    END;
END;
$$;

-- Update SPR voters with missing birth dates by extracting from IC numbers
UPDATE spr_voters 
SET 
    tarikh_lahir = extract_birth_date_from_ic(no_kp),
    updated_at = NOW()
WHERE 
    tarikh_lahir IS NULL 
    AND no_kp IS NOT NULL 
    AND extract_birth_date_from_ic(no_kp) IS NOT NULL;

-- Create an index on tarikh_lahir for better query performance
CREATE INDEX IF NOT EXISTS "spr_voters_tarikh_lahir_idx" ON "spr_voters" USING btree ("tarikh_lahir");

-- Add a comment to document this change
COMMENT ON COLUMN spr_voters.tarikh_lahir IS 'Date of birth - extracted from IC number if originally missing';

-- Drop the function as it's no longer needed after the migration
DROP FUNCTION IF EXISTS extract_birth_date_from_ic(TEXT);