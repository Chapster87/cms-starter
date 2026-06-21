-- Migration: Add preview_columns to public.models
-- Description: Stores an array of field handles to be displayed in reference selection modals.

ALTER TABLE public.models ADD COLUMN IF NOT EXISTS preview_columns JSONB DEFAULT '[]'::jsonb;

-- Update SCHEMA.md is handled separately in code tasks