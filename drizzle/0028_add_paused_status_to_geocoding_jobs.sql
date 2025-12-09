-- Add 'paused' status to geocoding_job_status enum
ALTER TYPE "geocoding_job_status" ADD VALUE IF NOT EXISTS 'paused';
