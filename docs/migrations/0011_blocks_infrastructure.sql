-- Create public.blocks table for reusable groups of fields
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  api_id text NOT NULL UNIQUE,
  emoji text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (Allowing authenticated access for now, similar to other registry tables)
CREATE POLICY "Allow authenticated read access" ON public.blocks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin full access" ON public.blocks
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Trigger for updated_at on blocks
CREATE TRIGGER set_blocks_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update public.fields to support polymorphic association
-- 1. Add block_id column
ALTER TABLE public.fields ADD COLUMN block_id uuid REFERENCES public.blocks(id) ON DELETE CASCADE;

-- 2. Make model_id nullable
ALTER TABLE public.fields ALTER COLUMN model_id DROP NOT NULL;

-- 3. Add polymorphic constraint to ensure a field belongs to EITHER a model OR a block
ALTER TABLE public.fields ADD CONSTRAINT field_parent_check
  CHECK ((model_id IS NOT NULL AND block_id IS NULL) OR (model_id IS NULL AND block_id IS NOT NULL));

-- 4. Create index for performance
CREATE INDEX idx_fields_block_id ON public.fields(block_id);

-- Comment explaining the changes
COMMENT ON COLUMN public.fields.block_id IS 'Reference to the block this field belongs to, if not associated with a model.';