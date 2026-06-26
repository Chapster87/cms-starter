# Plan: Remote MCP Expansion

This document outlines the transition of the ForgeCMS MCP server from a local-only sidecar to a public-facing, authenticated service.

## 1. Objectives

- Allow authorized agents to manage CMS content and schema from any location.
- Maintain strict security over database write operations.
- Integrate the MCP protocol directly into the Next.js application lifecycle.

## 2. Technical Architecture

### Current State (Local)

- **Transport**: `StdioServerTransport`
- **Connectivity**: Local process execution by Cline/AI Agent.
- **Auth**: Inherited from local environment variables.

### Target State (Remote)

- **Transport**: `SSEServerTransport` (Server-Sent Events)
- **Connectivity**: HTTP/HTTPS endpoint at `/api/mcp`.
- **Auth**: Bearer Token via `Authorization` header.

## 3. Implementation Steps

### Phase 1: Transport & Routing

- Create a new Next.js API route `src/app/api/mcp/route.ts`.
- Implement the MCP SSE handler using the `@modelcontextprotocol/sdk`.
- Handle both the GET (SSE establishment) and POST (Message delivery) requirements of the protocol.

### Phase 2: Authentication

- Reuse the existing `CMS_API_TOKEN` logic or create a dedicated `MCP_ACCESS_TOKEN`.
- Implement middleware or inline checks to validate the Bearer token before processing any MCP requests.

### Phase 3: Resource Scaling

- Add tools for direct SQL execution (restricted to Admin roles).
- Add tools for bulk asset uploads via the Media Library.
- Expose the GraphQL CDA schema as an MCP Resource to help agents write better queries.

## 4. Security Considerations

- **CSRF**: Ensure SSE endpoints are protected against cross-site requests.
- **Rate Limiting**: Implement strict rate limits for the MCP endpoint to prevent brute-force tool execution.
- **Audit Logs**: Ensure every action taken via MCP is logged to `public.audit_logs` with a specific "Agent" or "MCP" identifier.

## 5. Timeline

This plan is to be executed when remote content management or multi-user agent collaboration becomes a priority.
