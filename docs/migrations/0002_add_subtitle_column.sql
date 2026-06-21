-- Migration: Add subtitle_column to public.models
-- Description: Stores the field handle to be displayed as a subtitle in reference selection modals.

ALTER TABLE public.models ADD COLUMN IF NOT EXISTS subtitle_column TEXT;

-- Update SCHEMA.md is handled separately