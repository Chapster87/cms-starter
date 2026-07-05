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
  const input = process.argv[2]

  if (!input) {
    console.error("Error: Please provide a path to a .sql file or inline SQL.")
    console.log(
      "Usage: npx tsx scripts/exec-sql.ts <path-to-sql-file | inline-sql>"
    )
    process.exit(1)
  }

  let sql = ""
  let isFile = false

  // Check if it's a file path
  if (
    input.endsWith(".sql") ||
    fs.existsSync(path.resolve(process.cwd(), input))
  ) {
    const absolutePath = path.resolve(process.cwd(), input)
    if (fs.existsSync(absolutePath)) {
      sql = fs.readFileSync(absolutePath, "utf8")
      isFile = true
    }
  }

  // If not a file, treat as inline SQL
  if (!isFile) {
    sql = input
  }

  console.log(
    `🚀 Executing ${isFile ? "migration from file" : "inline SQL"}: ${
      isFile ? input : sql.substring(0, 50) + (sql.length > 50 ? "..." : "")
    }...`
  )

  const { data, error } = await supabase.rpc("exec_sql", { sql })

  if (error) {
    console.error("❌ Migration failed!")
    console.error(JSON.stringify(error, null, 2))
    process.exit(1)
  }

  console.log("✅ Migration executed successfully!")
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
