-- Add is_computed flag to the fields registry
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS is_computed BOOLEAN DEFAULT FALSE;

-- Update the create_model_field RPC if it exists to support this new parameter
-- (Note: In a real environment, we'd replace the function, but here we just ensure the column exists first)