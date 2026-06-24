-- Create globals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.globals (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert initial site_settings if not present
INSERT INTO public.globals (key, value)
VALUES ('site_settings', '{
  "defaultPageTitle": "",
  "titleSuffix": "",
  "fallbackDescription": "",
  "noIndex": false,
  "socialSiteName": "",
  "twitterHandle": "",
  "socialCard": null,
  "facebookUrl": "",
  "instagramUrl": "",
  "siteUrl": ""
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.globals ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read globals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'globals' AND policyname = 'Allow authenticated read access'
    ) THEN
        CREATE POLICY "Allow authenticated read access" ON public.globals
          FOR SELECT TO authenticated USING (true);
    END IF;
END
$$;

-- Allow admins to update globals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'globals' AND policyname = 'Allow admin update access'
    ) THEN
        CREATE POLICY "Allow admin update access" ON public.globals
          FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          );
    END IF;
END
$$;
