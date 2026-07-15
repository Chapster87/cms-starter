import { createClient } from "@supabase/supabase-js"

import { CDACore } from "@/server/cms/cda/CDACore"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const generateSchema = async () => {
  const cda = new CDACore(supabase)
  return cda.generateSchema()
}
