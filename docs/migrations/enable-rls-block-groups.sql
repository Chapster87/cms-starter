-- Enable Row Level Security
ALTER TABLE public.block_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read block groups
CREATE POLICY "Allow authenticated select on block_groups" 
ON public.block_groups FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Authenticated users can insert block groups
CREATE POLICY "Allow authenticated insert on block_groups" 
ON public.block_groups FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: Authenticated users can update block groups
CREATE POLICY "Allow authenticated update on block_groups" 
ON public.block_groups FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy: Authenticated users can delete block groups
CREATE POLICY "Allow authenticated delete on block_groups" 
ON public.block_groups FOR DELETE 
TO authenticated 
USING (true);