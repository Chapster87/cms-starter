-- Create block_groups table
CREATE TABLE IF NOT EXISTS public.block_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    emoji text,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Add group_id to blocks table
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.block_groups(id) ON DELETE SET NULL;