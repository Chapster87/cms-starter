-- Add display_order column to blocks table
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;