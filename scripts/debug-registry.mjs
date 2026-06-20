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

async function debug() {
  console.log("Fetching models...")
  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("*")

  if (modelsError) {
    console.error("Error fetching models:", modelsError)
    return
  }

  console.log("Models found:", models.length)
  const standingsModel = models.find(
    (m) =>
      m.table_name === "standings" ||
      m.model_name === "standings" ||
      m.friendly_name === "Standings"
  )
  const leagueModel = models.find(
    (m) =>
      m.table_name === "league" ||
      m.table_name === "leagues" ||
      m.friendly_name === "Leagues" ||
      m.friendly_name === "League"
  )

  console.log("Standings Model:", JSON.stringify(standingsModel, null, 2))
  console.log("League Model:", JSON.stringify(leagueModel, null, 2))

  if (standingsModel) {
    console.log("\nAttempting to join standings and leagues via PostgREST...")
    const { data: joinData, error: joinError } = await supabase
      .from("standings")
      .select("*, league!inner(id)")
      .limit(1)

    if (joinError) {
      console.log(
        "Join Error (league!inner):",
        JSON.stringify(joinError, null, 2)
      )
      const { data: joinData2, error: joinError2 } = await supabase
        .from("standings")
        .select("*, leagues!inner(id)")
        .limit(1)
      if (joinError2) {
        console.log(
          "Join Error (leagues!inner):",
          JSON.stringify(joinError2, null, 2)
        )
      } else {
        console.log(
          "Join Success (leagues!inner):",
          JSON.stringify(joinData2, null, 2)
        )
      }
    } else {
      console.log(
        "Join Success (league!inner):",
        JSON.stringify(joinData, null, 2)
      )
    }

    console.log("\nFetching fields for Standings model...")
    const { data: fields, error: fieldsError } = await supabase
      .from("fields")
      .select("*")
      .eq("model_id", standingsModel.id)

    if (fieldsError) {
      console.error("Error fetching fields:", fieldsError)
    } else {
      console.log("Fields for Standings:", JSON.stringify(fields, null, 2))
    }
  }
}

debug()
