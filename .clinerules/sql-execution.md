# SQL Execution Guidelines

> [!IMPORTANT]
> **DO NOT attempt to execute SQL commands via the terminal (Node.js, curl, or psql) in this environment.**
> Previous attempts have consistently failed due to Windows/PowerShell escaping issues and environment-specific execution restrictions.

## Recommended Workflow for Database Changes

1. **Migrations First**: Create a `.sql` file in `docs/migrations/` (e.g., `0001_initial.sql`).
2. **Execute via Node/PSQL**: Use the following pattern to execute migrations using the environment variables from `.env.local` and the system's `psql` client.

### Execution Pattern

```bash
node -e "const dotenv = require('dotenv'); dotenv.config({ path: '.env.local' }); const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL); const ref = url.hostname.split('.')[0]; const pw = process.env.SUPABASE_DB_PASSWORD; const conn = 'postgresql://postgres:' + pw + '@db.' + ref + '.supabase.co:5432/postgres'; const { execSync } = require('child_process'); try { const out = execSync('psql \"' + conn + '\" -f docs/migrations/YOUR_MIGRATION.sql'); console.log(out.toString()); } catch (e) { console.error(e.message); }"
```

3. **Verify via Code/API**: After execution, verify your changes by:
   - Checking the CMS Metadata Registry (`SCHEMA.md` or `public.models` table via API).
   - Testing the relevant API endpoints (e.g., `/api/models/schema`).
   - Observing the behavior in the CMS Editor.

## Why this approach works

- **Connection via DB Port**: Using `psql` directly on port 5432 bypasses many of the limitations and escaping issues found when trying to hit the Supabase Management API via `curl` or HTTPS RPCs.
- **Auth via Environment**: Credentials are pulled from `.env.local`, ensuring no hardcoded passwords in command history.
- **Atomic Migrations**: Using the `-f` flag with a file ensures the entire migration is processed as written.

## Best Practices

- **Atomic Migrations**: When updating the database, do so in logical blocks.
- **RLS First**: Always ensure Row-Level Security (RLS) is enabled and policies are defined for any new table created via the dashboard.
- **Update Metadata**: If you change a table structure, ensure you also update the corresponding entries in the `public.models` and `public.fields` tables so the CMS remains in sync.
