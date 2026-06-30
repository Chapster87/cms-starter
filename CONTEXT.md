# Custom CMS - Context & Implementation Roadmap

## Project Overview

A professional, custom-built Content Management System (CMS) utilizing **Next.js** (App Router) for the frontend/admin interface and **Supabase (Postgres)** for data persistence and schema management. The system is designed to be metadata-driven, allowing for dynamic model and field definitions that synchronize with the physical database via a centralized registry.

## Architectural Principles

- **Separation of Concerns:** Routes are split into `/editor` (Content Management/Record editing) and `/schema` (Model & Table Definitions).
- **Metadata-Driven Architecture:** Field types, labels, validation, and UI ordering are stored in a `fields` registry and utilized by a dynamic form engine (`RecordForm`). See [SCHEMA.md](./SCHEMA.md) for detailed database registry structure.
- **Native Supabase Integration:** Uses the native Supabase client (PostgREST via `dataService`) for reliable data operations and `SECURITY DEFINER` RPCs for schema-modifying operations.
- **SQL Execution:** A specialized `exec_sql(sql text)` RPC is available for advanced schema migrations. For record inspection and manual data management, AI agents should use the **ForgeCMS MCP Server**, which provides high-privilege access via the Supabase Service Role.
- **Supabase SSR & Middleware:** Implements `@supabase/ssr` for robust authentication. Uses Next.js Middleware to automatically refresh sessions and synchronize tokens with cookies, preventing "Refresh Token Not Found" errors.
- **URL-Driven State:** Modals and management actions are driven by query parameters (e.g., `?action=new-field`) for deep-linking and cleaner state synchronization.
- **Zero-Prop Architecture:** Forms (`ModalModel`, `ModalField`) are self-contained, fetching their own data and auth state.
- **Local-First Organization:** Components are grouped within feature directories (e.g., `_components`, `_data`) close to their point of use.

## Core Features

### 1. Schema Builder & Field Management

- **Centralized Registry:** Tracks metadata like `field_label`, `field_type`, `is_required`, and `is_unique`.
- **Atomic Schema Updates:** Integrated API and RPCs update both database physical schema and CMS metadata in a single transaction.
- **Intelligent ID Generation:** Technical IDs (tables/columns) are auto-derived from labels but "detach" once manually edited.
- **DND Reordering:** Full drag-and-drop support for field ordering via `@dnd-kit`, persisted to `public.fields.ui_order`.
- **Schema Synchronization:** Detection mechanism to import pre-existing database columns into the CMS management layer.
- **Draft/Publish Workflow:** Per-model toggle to enable draft states. Synchronizes a `status` column across physical tables with robust 3-step migration logic (Add -> Backfill -> Default).

### 2. Content Editor & Field Suite

- **Dynamic Form Engine:** Renders inputs based on model metadata, respecting `ui_order` and system field read-only constraints.
- **"Lax Drafts" Validation:** Intelligent validation engine that allows records in `draft` state to bypass certain required field checks, ensuring content velocity while maintaining strict rules for `published` data.
- **Status Visibility:** Global status indicators (Green for Published, Gold for Draft) integrated into record lists, context menus, and Reference browse modals.
- **Advanced Field Suite:**
  - **SlugField:** Auto-generating sanitized technical names until manually overridden.
  - **RichTextField:** High-fidelity WYSIWYG using **Tiptap** with custom alignment and heading controls.
- **Structured Text:** A ProseMirror-based (via Tiptap) JSON storage format that allows interleaving rich text with reusable Blocks, ensuring platform-agnostic content delivery. Uses a custom `cmsBlock` node to embed CMS blocks within the document structure.
  - **SeoField:** Specialized composite field with collapsible Radix Accordion for Meta/OG data.
  - **Linked Records (Reference):** Pill-based selection UI with a Sanity-inspired browse modal.
  - **MediaField:** Visual grid for asset management, now integrated with a centralized Media Library and Cloudinary.
  - **TagField:** Pill-based management for keyword collections (JSONB arrays).
  - **SelectField (Dropdown):** Support for predefined options with automatic slug generation for values.
  - **DateField (Enhanced):** Supports date-only or datetime-local modes with integrated timezone selection and absolute UTC synchronization.
  - **Markdown:** Dual-tab Write/Preview interface using the `marked` library.
  - **Modular Content:** A JSONB "Stacked Accordion" field type allowing for dynamic block composition. Supports DND reordering and explicit block opt-in via field settings.
  - **Blocks System:** A standalone registry (`public.blocks`) for reusable content fragments. Blocks support their own set of fields, enabling complex nested content structures.
  - **Structured Text:** A high-fidelity ProseMirror-based (via Tiptap) field type for rich text interleaved with CMS Blocks. Supports deep recursive resolution in the GraphQL CDA and custom NodeViews for inline editing.

## Implementation Roadmap

### 1. Immediate Tasks (Current Focus)

- [ ] **Convert Standings Table model to a Block:** This model is highly specific and should be converted to a reusable block. Requires generalizing custom functionality (like reference resolution) so it can function as a standard block type.

### 2. Next Steps (Upcoming)

### 3. Future Roadmap

- [ ] **Onboarding:** Professional Project README.md and Installation CLI for automated environment setup. Make note of tables that should exist by default(models, authors, fields, model_groups, users, audit_logs, media_assets, etc) and what columns they should start with (perhaps using our existing database to populate this list). Need to create a admin account by default during init.
- [ ] **Environment Tooling:** Tooling for migrating model definitions between development and production environments.
- [ ] **Implement "View-As" Control** Allow Admin user roles to view CMS as other roles to assist in debugging/permission audits.
- [ ] **Dynamic Permission Management:** CMS UI for editing what Roles can do.
- [ ] **Invite by Email:** Implement an "Invite by Email" flow (requires SMTP configuration).
- [ ] **Remote MCP Expansion:** Transition the local MCP bridge to a public-facing, authenticated SSE service for remote agent management. See [mcp-remote-expansion.md](./docs/plans/roadmap/mcp-remote-expansion.md) for the detailed plan.

### 4. Completed Items

- [x] **Structured Text Implementation**: Developed a Tiptap-based field with a custom `cmsBlock` extension. Includes a React `NodeView` for inline editing, a dual-tab Write/Preview interface, and a recursive JSX renderer for the frontend.
- [x] **Modular Content Field**: Implemented a robust JSONB field with a searchable `BlockSelectorModal` and DND-powered block composition. Integrated with `RecordForm` auto-save and persistence logic.
- [x] **Blocks Infrastructure**: Created the `public.blocks` registry and updated the `fields` table to support polymorphic associations (Model vs Block). Implemented CRUD APIs and standardized migration workflows.
- [x] **MCP Agent Bridge (Local)**: Implemented a Model Context Protocol server (`src/server/mcp`) that exposes CMS CRUD operations as tools for AI agents, enabling direct record manipulation and schema awareness.
- [x] **Dynamic Record Table Columns:** Empowered users to configure which fields from a model appear as columns in the record list view. Features include bulk reference resolution, borderless media previews with `next/image`, and interactive reordering via a Gear utility in the header.
- [x] **Field-Specific Settings:**
  - Implemented a Radix Tabs interface (Basic, Validation, Appearance) in the Field Modal.
  - Added advanced numeric settings: Min, Max, Step.
  - Added text validation: Min/Max length and a Regex Preset system (Email, URL, etc.) with custom pattern support.
  - Implemented Appearance settings: Custom placeholders and help text.
  - Added granular tool configuration for the Rich Text Field (Tiptap), allowing per-field control over available toolbar buttons.
  - Integrated settings into the `RecordForm` engine for client-side validation and component-level customization.
- [x] **Advanced Draft Workflow (Auto-save/Publish/Changed)**:
  - Implemented shadow JSON storage via `_draft` column for draft-enabled models.
  - Developed debounced auto-save engine with immediate "Changed" (Blue) status feedback, with automatic bypass for models without draft mode.
  - Created a professional Split-Action button UI for Publish/Unpublish/Delete.
  - Implemented Sanity-style overlapping status dots in record lists and reference modals.
  - Enhanced GraphQL CDA with `preview` and `includeDrafts` modes for staging environments.
- [x] **Draft/Publish Implementation:** Full end-to-end status management. Added `has_draft_mode` to registry, automated SQL migrations for `status` columns, implemented schema cache refreshing (`NOTIFY pgrst`), and updated the GraphQL CDA to filter for `published` content by default. Enhanced editor UI to gracefully handle models with draft mode disabled (direct saves, hidden status metadata).
- [x] **Linked Records Stability:** Fixed RPC parameter naming (`t_name`) across List, Search, and Previews APIs. Enhanced label discovery logic to automatically resolve friendly names (name, title, label, etc.) instead of raw UUIDs in pills and browser modals.
- [x] **Site Navigation Model:** Modern, hierarchical drag-and-drop navigation system with automatic path resolution and group management.
- [x] **Unified Button Infrastructure:** Converted all frontend-facing `<button>` tags to a standardized `<Button />` component with consistent Primary/Secondary brand styling.
- [x] **Singleton Model Workflow:** Implemented specialized handling for singleton models (Global Settings, etc.), including modal-based initialization, custom "Empty State" branded cards, and automatic redirect to the editor. Added strict safeguards to block duplicate record creation both in the UI and submission logic.
- [x] **Model Grouping & Hierarchical DND**:
  - Implemented full CRUD for Model Groups (folders) to organize the schema.
  - Developed a specialized **Global Tree DND System** (`useTreeDnd` hook and `tree-helpers.ts`) supporting vertical reordering and horizontal nesting (indentation).
  - Features real-time "neighbor-aware" depth calculation and visual indentation guides.
  - Applied this system to both the **Schema Model List** and the **Navigation Field**, ensuring a consistent UX across the platform.
- [x] **Content Delivery API (GraphQL CDA)**:
  - Developed a custom, high-fidelity GraphQL engine (`/api/graphql`) that dynamically maps CMS models to professional PascalCase types.
  - Implemented native resolution for **Linked Records (References)**, resolving UUID arrays into nested, structured objects.
  - Enhanced **Media Asset** resolution, returning full asset metadata (URL, Name, Type) instead of raw JSON.
  - Established a secure **API Token System** (`CMS_API_TOKEN`) with a dual-authentication strategy for internal playground and external project use.
  - Created a comprehensive `CDA-GUIDE.md` for team onboarding and external implementation.
- [x] **Field Type Expansion:** Formally integrated `rich_text` and `tags` into the automated schema generation layer. Added advanced validation (min/max tags) and appearance settings (placeholders) to the Schema Builder. Modernized script infrastructure (sync-types) to leverage Node 22 native capabilities.
- [x] **Field Type Expansion:** Implemented a new "Dropdown / Select" field type with support for custom choice management in the schema builder.
- [x] **Timezone-Aware Date Handling:** Upgraded the `DateField` to handle timezone selection and prevent UI jitter, ensuring absolute UTC storage while maintaining naive local picker behavior.
- [x] **Toast messages for notifications** - Integrated Radix Toast with Jotai for global success/error/info alerts across Schema and Editor.
- [x] **Details Sidebar** - Integrated a metadata-driven right sidebar using Radix Accordion. Displays Record ID, Publish Status, and timestamps (Created/Updated/Published). Respects `has_draft_mode` by suppressing draft-specific metadata for standard models. Includes independent scrolling and on-brand typography.
- [x] **User Management & RBAC**:
  - Established a comprehensive **Role-Based Access Control (RBAC)** system with `admin`, `editor`, and `author` roles.
  - Implemented a dedicated `/settings/users` module with a URL-driven management interface.
  - Integrated **Supabase Admin API** to allow administrators to create and manage users directly within the CMS.
  - Developed a specialized **Google Metadata Sync** engine that automatically pulls profile names and avatars from Google Auth into the CMS user record.
  - Created a reusable **Radix Avatar** component with intelligent fallbacks and consistent design language.
- [x] **Content Attribution**: Updated the database and UI to track `created_by` and `updated_by` metadata for every record. Enhanced record lists and sidebars to display this attribution. System fields are strictly hidden from editors and schema builders to ensure data integrity.
- [x] **Identity Integration & Author Sync**:
  - Implemented seamless linking between content records (Authors) and CMS User profiles via a "Virtual Model" system.
  - Developed an **Instant Profile Sync** engine that automatically populates Author Name and Avatar from their linked Google identity upon selection.
  - Customized the **Reference Field UI** with specialized cards for Users, including dedicated icons and email-based identifiers.
  - Integrated a manual "Sync from User Profile" action for on-demand identity updates.
- [x] **Optimized Audit Log System**:
  - Developed a high-fidelity **History Sidebar** integrated into the Record Details panel.
  - Implemented **Deep Diffing** logic to store only field-level deltas instead of full record snapshots, drastically reducing database storage requirements.
  - Engineered an **Auto-save Consolidation** engine that merges frequent debounced saves (within 5-minute windows) into single log entries.
  - Integrated automatic **Retention Pruning** that maintains the last 50 entries per record.
  - Enhanced UI with **Delta Pills** that provide immediate visibility into exactly which fields were modified during any historical event (Create, Update, Publish, Draft Update).
- [x] **Media Library Implementation**:
  - Implemented storage-agnostic registry with Cloudinary provider.
  - Created standalone `/media` gallery with Folder Sidebar and Tagging.
  - Integrated Cloudinary Media Library Widget for account-wide asset browsing.
  - Developed Registry Sync tool for Cloudinary alignment.
  - Updated GraphQL CDA to resolve media IDs into full metadata objects.
- [x] **Robust GraphQL Filtering**:
  - Resolved "relationship schema cache" errors in PostgREST by implementing a two-step recursive filtering engine.
  - Added support for complex nested relationship filtering (e.g., `where: { league: { slug: "..." } }`).
  - Implemented automatic JSONB quoting for reference column filtering.
- [x] **Linked Record Customization**:
  - Empowered users to configure which fields appear in the Reference/Linked Record selection modal.
  - Implemented a "Preview Settings" tab in the Model Editor to manage these display preferences.
  - Standardized the selection interface on a high-fidelity 2-line layout with configurable subtitles.
- [x] **Persisted Record Table Sorting**:
  - Added ordering controls to record table column headers with visual feedback icons.
  - Implemented a dedicated "Sort" dropdown utility in the header for mobile-friendly access.
  - Integrated database-level persistence via `default_sort_column` and `default_sort_direction` in the model registry.
  - Automated state synchronization between the UI and database to maintain preferred ordering across sessions.
- [x] **Global Site Settings & baseline SEO**:
  - Implemented a centralized `/settings/site` module for managing global variables.
  - Features include: Site URL (with dynamic `SlugField` integration), baseline SEO (Default Title, Suffix, Fallback Description, No Index), and Brand Assets (Favicon).
  - Comprehensive social connectivity for Open Graph/Twitter metadata and profile links.
  - Fully integrated with the GraphQL CDA, supporting automatic resolution of media assets (Favicon/Social Card).
- [x] **Advanced Type Safety & Logical Controls (Phase 3 & 4)**:
  - **Unified Metadata Types**: Consolidated all record shapes into a single generated file (`cms-generated.ts`) driven by the database registry.
  - **Relationship Integrity**: Enhanced `dataService` and created a client-side `reference-resolver` to automatically resolve record IDs into rich, typed objects, ensuring frontend data matches TypeScript interfaces.
  - **Computed Fields**: Added `is_computed` metadata support. The form engine now identifies read-only system fields, disabling them in the UI and excluding them from save payloads.
  - **Permission-Based UI (RBAC)**: Integrated field-level access control via `required_role` and `hide_from_roles` metadata. `RecordForm` conditionally renders or disables fields based on the current user's role.
  - **Architectural Pruning**: Modernized the type system by eliminating redundant manual definitions (e.g., `media.ts`) in favor of the central generated source of truth.
- [x] **Fieldset Grouping & Persistence**:
  - Implemented visual grouping for model fields (Fieldsets) with stable drag-and-drop support.
  - Developed a professional two-step creation workflow in the Field Modal.
  - Engineered immediate state synchronization to ensure group assignments persist reliably across page refreshes.
  - Created high-fidelity accordion styling for grouped fields in the `RecordForm`, matching the project's SEO field type design.
  - Implemented intelligent hiding of empty groups to maintain a clean record editing experience.

## Glossary

- **MCP:** Model Context Protocol. Provides AI agents with direct tools for CMS interaction.
- **CMS:** Custom management interface for digital assets and database schema.
- **Page Model:** Database schema and Next.js component for content display/editing.
- **Edge Functions:** Serverless logic for SSR, data validation, and scheduled tasks.
- **Registry:** Centralized configuration tables (`models`, `fields`, `media_assets`) defining CMS behavior.

## Relevant Files

- `src/components/fields/`: Directory containing all global form components.
- `src/app/media/`: Standalone Media Library and gallery components.
- `src/client/media-service.ts`: Registry management for assets.
- `src/app/schema/`: Schema Builder and model management logic.
- `src/app/editor/`: Content Management and dynamic form engine.
- `src/utils/supabase.ts` & `src/utils/supabase-server.ts`: Standardized SSR-friendly Supabase clients.
- `src/middleware.ts`: Global session refreshing and cookie synchronization.
- `src/app/api/graphql/`: The production Content Delivery API (CDA) endpoint and schema generator.
- `src/utils/field-types.ts`: Source of truth for field and Postgres type mapping.
- `src/client/data-service.ts`: Centralized service for CRUD operations using native Supabase patterns.
- `docs/CDA-GUIDE.md`: Comprehensive documentation for the GraphQL CDA.
- `docs/MEDIA-LIBRARY.md`: Documentation for the asset management system.
