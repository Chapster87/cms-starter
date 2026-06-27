import "dotenv/config"
import path from "path"
import fs from "fs"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

// Load .env.local explicitly since we're in a script
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  const sql = `
    -- Create Fieldsets table
    CREATE TABLE IF NOT EXISTS public.fieldsets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      model_id uuid REFERENCES public.models(id) ON DELETE CASCADE,
      label text NOT NULL,
      ui_order integer DEFAULT 0,
      settings jsonb DEFAULT '{"default_open": true}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Add fieldset_id to fields
    ALTER TABLE public.fields 
    ADD COLUMN IF NOT EXISTS fieldset_id uuid REFERENCES public.fieldsets(id) ON DELETE SET NULL;

    -- Enable RLS
    ALTER TABLE public.fieldsets ENABLE ROW LEVEL SECURITY;

    -- Create RLS Policies
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'fieldsets' AND policyname = 'Allow all to service role'
      ) THEN
        CREATE POLICY "Allow all to service role" ON public.fieldsets
        FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;

    -- Re-notify PostgREST
    NOTIFY pgrst, 'reload schema';
  `

  const { data, error } = await supabase.rpc("exec_sql", { sql })

  if (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }

  console.log("Migration successful:", data)
}

runMigration()
