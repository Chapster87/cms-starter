# ForgeCMS MCP Guide

The **ForgeCMS MCP Server** provides AI agents with high-privilege, direct access to the CMS data and metadata. This bypasses typical API limitations and provides a more reliable way to inspect and verify the system state.

## Core Capabilities

- **Direct Database Access**: Interact with any table in the CMS schema via the Supabase Service Role.
- **Metadata Inspection**: Easily query the `models` and `fields` tables to understand the CMS structure.
- **Native Performance**: Leverages Node 22's native fetch and WebSocket support for optimal speed and stability.

## Available Tools

### `get_records`

Fetches all records for a given CMS model. Use this for inspecting data, verifying migrations, or understanding the current state of a table.

**Arguments:**

- `model` (required): The table name of the model (e.g., `'authors'`, `'models'`, `'seasons'`).

**Example Usage:**

```typescript
use_mcp_tool(
  server_name: "ForgeCMS",
  tool_name: "get_records",
  arguments: { model: "models" }
)
```

## Recommended Workflow

1. **Verify State**: Before making changes, use `get_records` to check the current data or schema.
2. **Execute Changes**: Perform your tasks (code changes, migrations, etc.).
3. **Validate**: Use `get_records` again to verify that your changes were applied correctly and that the data matches expectations.

## Why use MCP?

- **Reliability**: Avoids complex PowerShell/Bash escaping issues common in the terminal.
- **Security**: Uses the Supabase Service Role securely through the MCP bridge, requiring no manual credential handling in the chat.
- **Context Awareness**: Returns structured JSON data that is easily parsed and understood by AI agents.

## Troubleshooting

- If the MCP server fails to respond, ensure that the `.env.local` file contains valid `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` variables.
- The server runs on Node 22.23.1+; older versions may lack the necessary native globals.
