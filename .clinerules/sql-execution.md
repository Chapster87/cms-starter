# SQL Execution Guidelines

> [!IMPORTANT]
> **DO NOT attempt to execute SQL commands via the terminal (Node.js, curl, or psql) in this environment.**
> Previous attempts have consistently failed due to Windows/PowerShell escaping issues and environment-specific execution restrictions.

## Recommended Workflow for Database Changes

1. **Use the Supabase Dashboard**: Perform all schema modifications (adding columns, changing types, RLS policies) and direct SQL queries through the **Supabase SQL Editor** in your web browser.
2. **Verify via Code/API**: Instead of querying the database from the CLI, verify your changes by:
   - Checking the CMS Metadata Registry (`SCHEMA.md` or `public.models` table via API).
   - Testing the relevant API endpoints (e.g., `/api/models/schema`).
   - Observing the behavior in the CMS Editor.

## Why CLI Execution is Forbidden

- **Escaping Failures**: PowerShell on Windows interferes with nested JSON and SQL quotes in `curl` and `node -e` commands.
- **Environment Restrictions**: Node.js scripts using `https` to hit the Supabase management RPCs are frequently blocked or fail to stream output correctly in this shell.
- **Data Integrity**: Manual execution via the dashboard ensures you are operating in a stable, visual environment with transaction support.

## Best Practices

- **Atomic Migrations**: When updating the database, do so in logical blocks.
- **RLS First**: Always ensure Row-Level Security (RLS) is enabled and policies are defined for any new table created via the dashboard.
- **Update Metadata**: If you change a table structure, ensure you also update the corresponding entries in the `public.models` and `public.fields` tables so the CMS remains in sync.
