import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing Supabase credentials in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Standard utility to execute SQL migrations via the exec_sql RPC.
 * Usage: npx tsx scripts/exec-sql.ts docs/migrations/your-migration.sql
 */
async function main() {
  const filePath = process.argv[2]

  if (!filePath) {
    console.error("Error: Please provide a path to a .sql file.")
    console.log("Usage: npx tsx scripts/exec-sql.ts <path-to-sql-file>")
    process.exit(1)
  }

  const absolutePath = path.resolve(process.cwd(), filePath)

  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found at ${absolutePath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(absolutePath, "utf8")

  console.log(`🚀 Executing migration: ${filePath}...`)

  const { error } = await supabase.rpc("exec_sql", { sql })

  if (error) {
    console.error("❌ Migration failed!")
    console.error(JSON.stringify(error, null, 2))
    process.exit(1)
  }

  console.log("✅ Migration executed successfully!")
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
