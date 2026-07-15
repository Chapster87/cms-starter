# Custom CMS - Context & Domain Language

> This file defines the project's domain and architectural pillars. For the current implementation status and roadmap, see [docs/ROADMAP.md](docs/ROADMAP.md).

## Core Domain

A professional, metadata-driven Content Management System (CMS) built with **Next.js (App Router)** and **Supabase (Postgres)**.

### The Registry Pattern

The CMS is powered by a centralized registry (`public.models`, `public.fields`, `public.blocks`) that defines both the physical database schema and the CMS management interface.

- **Model**: A top-level entity representing a database table (e.g., `Articles`, `Products`).
- **Field**: An atomic unit of data within a model or block, containing metadata for validation, UI rendering, and physical storage.
- **Block**: A reusable content fragment that can be embedded within fields or other blocks, enabling modular content composition.

### Architectural Pillars

- **Physical-Metadata Sync**: Every schema modification (adding a field, changing a type) updates both the Postgres physical schema and the CMS metadata registry in a single atomic flow.
- **Dynamic Form Engine (`RecordForm`)**: A specialized React engine that translates model metadata into a high-fidelity editing interface with field-level validation, DND reordering, and draft management.
- **Content Delivery API (GraphQL CDA)**: A custom-built GraphQL engine that maps the registry to PascalCase types, providing high-performance, structured content access with native relationship resolution.
- **Role-Based Access Control (RBAC)**: Secure management layer for `admin`, `editor`, and `author` roles, integrated with Supabase Auth and field-level visibility rules.

### Key Workflows

- **Draft/Publish**: Optional shadow storage and status management for records, allowing iterative editing without impacting production content.
- **Modular Content**: A flexible composition system using Blocks and the Stacked Accordion UI to build complex, nested layouts.
- **Structured Text**: Rich text interleaved with reusable blocks, utilizing a ProseMirror-based storage format.

## Glossary

- **Registry**: The set of database tables defining CMS structure.
- **CDA**: Content Delivery API (GraphQL).
- **Physical Schema**: The actual Postgres tables and columns.
- **Metadata**: Configuration data in the registry (labels, types, validation).
- **Singleton**: A model restricted to exactly one record (e.g., Global Settings).
- **Fieldset**: A visual grouping of fields within a model's editor interface.

## GitHub Configuration

- **Sub-issues**: **ENABLED**. When using `/to-tickets` or `/wayfinder`, child tickets MUST be created as native GitHub sub-issues using the `--parent` flag.
- **Issue Dependencies**: **ENABLED**. When tickets have blockers, they MUST be formally linked using the `--blocked-by` flag.
- **Ticket Template**: Use the following `gh` command template for creating sub-issues:

  ```bash
  gh issue create --title "Refactor RecordForm to use the Engine" --body "## Parent
    #1


  ## What to build

  Description

  ## Acceptance criteria

  - [ ] Task
  - [ ] Task
  - [ ] Task
  - [ ] Task

  ## Blocked by

  - #16" --label "ready-for-agent" --parent 1 --blocked-by 16 --repo Chapster87/cms-starter
  ```
