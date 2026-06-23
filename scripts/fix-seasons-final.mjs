import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function run() {
  console.log(
    "Fixing missing attribution columns in 'seasons' table (Raw Fetch)..."
  )

  const sql = `
    -- Add created_by column if it doesn't exist
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seasons' AND column_name = 'created_by') THEN
            ALTER TABLE public.seasons ADD COLUMN created_by uuid REFERENCES auth.users(id);
        END IF;
    END $$;

    -- Add updated_by column if it doesn't exist
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seasons' AND column_name = 'updated_by') THEN
            ALTER TABLE public.seasons ADD COLUMN updated_by uuid REFERENCES auth.users(id);
        END IF;
    END $$;

    -- Notify PostgREST to reload schema cache
    NOTIFY pgrst, 'reload schema';
  `

  const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ sql }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      )
    }

    console.log("Migration successful via RPC.")

    // Verify columns
    const verifySql =
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'seasons'"
    const verifyResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ sql: verifySql }),
    })

    const columns = await verifyResponse.json()
    console.log(
      "Current columns in 'seasons':",
      columns.map((c) => c.column_name).join(", ")
    )

    const hasCreatedBy = columns.some((c) => c.column_name === "created_by")
    const hasUpdatedBy = columns.some((c) => c.column_name === "updated_by")

    if (hasCreatedBy && hasUpdatedBy) {
      console.log("SUCCESS: Attribution columns found.")
    } else {
      console.error("FAILURE: Columns still missing.")
    }
  } catch (error) {
    console.error("Error executing fix:", error.message)
  }
}

run()
