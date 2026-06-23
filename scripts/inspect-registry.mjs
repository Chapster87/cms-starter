import { createClient } from "@supabase/supabase-js"
import ws from "ws"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
})

async function inspect() {
  console.log("Looking for 'teams' model...")
  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("*")
    .or("table_name.eq.teams,slug.eq.teams,friendly_name.eq.Teams")

  if (modelsError) {
    console.error("Error fetching model:", modelsError)
    return
  }

  if (!models || models.length === 0) {
    console.log("Teams model not found in registry.")
    // Let's list all models just in case
    const { data: allModels } = await supabase
      .from("models")
      .select("table_name, slug, friendly_name")
    console.log("Available models:", allModels)
    return
  }

  const teamsModel = models[0]
  console.log("Teams Model:", JSON.stringify(teamsModel, null, 2))

  console.log("\nFetching fields for Teams model...")
  const { data: fields, error: fieldsError } = await supabase
    .from("fields")
    .select("*")
    .eq("model_id", teamsModel.id)
    .order("ui_order", { ascending: true })

  if (fieldsError) {
    console.error("Error fetching fields:", fieldsError)
  } else {
    console.log("Fields for Teams:", JSON.stringify(fields, null, 2))
  }
}

inspect()
