## Agent skills

### Issue tracker

GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Standard canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at root). See `docs/agents/domain.md`.

### Core Rules

This repository follows strict architectural and operational rules defined in the `.agents/` directory. All agents must adhere to these guidelines:

- **General Rules**: Overall operation and verification steps. See `.agents/agent-rules.md`.
- **Component Styling**: Rules for CSS modules and brand consistency. See `.agents/component-styling.md`.
- **Folder Organization**: Conventions for feature-based directory structure. See `.agents/folder-organization.md`.
- **MCP Guide**: Standards for interacting with the ForgeCMS MCP server. See `.agents/mcp-guide.md`.
- **Next.js Reference**: Specific patterns for the App Router and SSR. See `.agents/nextjs-ref.md`.
