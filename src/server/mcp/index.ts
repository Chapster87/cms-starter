import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

import { createMCPClient } from "../../utils/supabase-mcp"

/**
 * MCP Server for the Custom CMS.
 * Uses native fetch/WebSockets from Node 22+.
 */
const supabase = createMCPClient()

const server = new Server(
  {
    name: "cms-agent-bridge",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

/**
 * List available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_records",
        description: "Fetch all records for a given CMS model.",
        inputSchema: {
          type: "object",
          properties: {
            model: {
              type: "string",
              description: "The table name of the model (e.g., 'authors').",
            },
          },
          required: ["model"],
        },
      },
    ],
  }
})

/**
 * Handle tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "get_records": {
        const { data, error } = await supabase
          .from(args!.model as string)
          .select("*")
        if (error) throw error
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      }

      default:
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
        }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [{ type: "text", text: message }],
    }
  }
})

/**
 * Start the server.
 */
const transport = new StdioServerTransport()
server.connect(transport).catch((error) => {
  console.error("MCP Server Error:", error)
  process.exit(1)
})
