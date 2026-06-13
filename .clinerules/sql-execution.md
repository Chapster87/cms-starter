# SQL Execution Guidelines

When executing SQL against the Supabase management layer via the `exec_sql` RPC, follow these rules to ensure consistency and bypass PowerShell escaping issues on Windows:

## Use Node.js for SQL Execution

Instead of using `curl` directly in the terminal (which often fails due to complex nested escaping in PowerShell), use a small Node.js script to handle the request. This ensures that the SQL string is correctly JSON-encoded without shell interference.

### Example Template

```bash
node -e "const https = require('https'); const data = JSON.stringify({ sql: \`YOUR_SQL_HERE\` }); const options = { hostname: 'knqlsiuhdcflazlnefob.supabase.co', path: '/rest/v1/rpc/exec_sql', method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': '...', 'Authorization': 'Bearer ...', 'Content-Length': Buffer.byteLength(data) } }; const req = https.request(options, res => { let body = ''; res.on('data', d => body += d); res.on('end', () => console.log(body)); }); req.write(data); req.end();"
```

## Best Practices

1. **File-Based Execution**: For long SQL scripts, write the SQL to a temporary file (e.g., `migration.sql`) and use Node.js to read that file before sending the request. This keeps the command clean and avoids command-length limits.
2. **Atomic Operations**: Try to group related schema changes into a single SQL block to ensure they succeed or fail together.
3. **Verification**: Always run a follow-up query to verify that tables or columns were created as expected.
4. **Row-Level Security (RLS)**: Always enable RLS for newly created tables and define appropriate policies. This should be a default action for every table creation.
5. **Environment Variables**: Always retrieve the Supabase URL and Keys from `.env.local` before formulating the command.
