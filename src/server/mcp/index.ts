import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

import { createMCPClient } from "../../utils/supabase-mcp"
import { SupabaseRecordManager } from "../cms/adapters/supabase-record-manager"
import { CMSModelName } from "../../types/cms-generated"

/**
 * MCP Server for the Custom CMS.
 * Uses native fetch/WebSockets from Node 22+.
 */
const supabase = createMCPClient()
const recordManager = new SupabaseRecordManager(supabase)

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
      {
        name: "get_record_by_id",
        description: "Fetch a single record by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            model: {
              type: "string",
              description: "The table name of the model.",
            },
            id: {
              type: "string",
              description: "The unique identifier of the record.",
            },
          },
          required: ["model", "id"],
        },
      },
      {
        name: "create_record",
        description: "Create a new record in the CMS.",
        inputSchema: {
          type: "object",
          properties: {
            model: {
              type: "string",
              description: "The table name of the model.",
            },
            data: {
              type: "object",
              description: "The record data to insert.",
            },
          },
          required: ["model", "data"],
        },
      },
      {
        name: "update_record",
        description: "Update an existing record in the CMS.",
        inputSchema: {
          type: "object",
          properties: {
            model: {
              type: "string",
              description: "The table name of the model.",
            },
            id: {
              type: "string",
              description: "The unique identifier of the record to update.",
            },
            data: {
              type: "object",
              description: "The partial data to update.",
            },
          },
          required: ["model", "id", "data"],
        },
      },
      {
        name: "delete_record",
        description: "Delete a record from the CMS.",
        inputSchema: {
          type: "object",
          properties: {
            model: {
              type: "string",
              description: "The table name of the model.",
            },
            id: {
              type: "string",
              description: "The unique identifier of the record to delete.",
            },
          },
          required: ["model", "id"],
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
        const data = await recordManager.getRecords(args!.model as CMSModelName)
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      }

      case "get_record_by_id": {
        const data = await recordManager.getRecordById(
          args!.model as CMSModelName,
          args!.id as string
        )
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      }

      case "create_record": {
        const data = await recordManager.createRecord(
          args!.model as CMSModelName,
          args!.data as never
        )
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      }

      case "update_record": {
        const data = await recordManager.updateRecord(
          args!.model as CMSModelName,
          args!.id as string,
          args!.data as never
        )
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      }

      case "delete_record": {
        await recordManager.deleteRecord(
          args!.model as CMSModelName,
          args!.id as string
        )
        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted record ${args!.id} from ${args!.model}`,
            },
          ],
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
