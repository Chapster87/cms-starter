# Custom CMS - Context & Implementation Roadmap

## Project Overview

A professional, custom-built Content Management System (CMS) utilizing **Next.js** (App Router) for the frontend/admin interface and **Supabase (Postgres)** for data persistence and schema management. The system is designed to be metadata-driven, allowing for dynamic model and field definitions that synchronize with the physical database via a centralized registry.

## Architectural Principles

- **Separation of Concerns:** Routes are split into `/editor` (Content Management/Record editing) and `/schema` (Model & Table Definitions).
- **Metadata-Driven Architecture:** Field types, labels, validation, and UI ordering are stored in a `fields` registry and utilized by a dynamic form engine (`RecordForm`).
- **Native Supabase Integration:** Uses the native Supabase client (PostgREST via `dataService`) for reliable data operations and `SECURITY DEFINER` RPCs for schema-modifying operations.
- **SQL Execution:** A specialized `exec_sql(sql text)` RPC is available for advanced schema migrations and direct table manipulation when standard PostgREST or specific RPCs are insufficient. Direct SQL access (e.g., `psql`) is generally avoided in favor of this RPC to maintain consistency with the application's security model.
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

### 2. Content Editor & Field Suite

- **Dynamic Form Engine:** Renders inputs based on model metadata, respecting `ui_order` and system field read-only constraints.
- **Advanced Field Suite:**
  - **SlugField:** Auto-generating sanitized technical names until manually overridden.
  - **RichTextField:** High-fidelity WYSIWYG using **Tiptap** with custom alignment and heading controls.
  - **SeoField:** Specialized composite field with collapsible Radix Accordion for Meta/OG data.
  - **Linked Records (Reference):** Pill-based selection UI with a Sanity-inspired browse modal.
  - **MediaField:** Visual grid for asset management (currently URL-based).
  - **TagField:** Pill-based management for keyword collections (JSONB arrays).
  - **SelectField (Dropdown):** Support for predefined options with automatic slug generation for values.
  - **DateField (Enhanced):** Supports date-only or datetime-local modes with integrated timezone selection and absolute UTC synchronization.
  - **Markdown:** Dual-tab Write/Preview interface using the `marked` library.

## Implementation Roadmap

### 1. Immediate Tasks (Current Focus)

- [ ] **Draft/Publish Flow (Schema):**
  - [ ] Add `has_draft_mode` (boolean) to the `models` registry table.
  - [ ] Mechanism to add/sync `status` (Draft/Published) column to target model tables.
- [ ] **Draft/Publish Flow (API):**
  - [ ] Update record listing and retrieval to respect status filters.
- [ ] **Draft/Publish Flow (UI):**
  - [ ] Add status toggle/indicator to `RecordForm`.
  - [ ] Update `ReferenceField` browse modal to show colored status dots: Green (Published), Gold/Yellow (Draft).

### 2. Next Steps (In Progress/Upcoming)

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
- [x] **Field Type Expansion:** Implemented a new "Dropdown / Select" field type with support for custom choice management in the schema builder.
- [x] **Timezone-Aware Date Handling:** Upgraded the `DateField` to handle timezone selection and prevent UI jitter, ensuring absolute UTC storage while maintaining naive local picker behavior.
- [ ] **Modular Blocks (Modular Content):** Implement a "mini-model" registry (inspired by DatoCMS `dast`) for component-based layouts.
- [ ] **Media Library:** Transition from external URLs to full Supabase Storage integration with a centralized media browser.
- [ ] **Model Reordering:** Apply DND logic to the top-level Models sidebar and dashboard.
- [ ] **Field-Specific Settings:** Add advanced configuration for types (e.g., number ranges, regex validation).

### 3. Future Roadmap

- [ ] **Field Type Expansion:** Formal integration of `rich_text` and `tags` into the automated schema generation layer.
- [ ] **Type Safety:** Evaluation of Schema & Type Generation for the frontend (similar to Sanity/Strapi).
- [ ] **Onboarding:** Professional Project README.md and Installation CLI for automated environment setup.
- [ ] **Environment Tooling:** Tooling for migrating model definitions between development and production environments.

## Glossary

- **CMS:** Custom management interface for digital assets and database schema.
- **Page Model:** Database schema and Next.js component for content display/editing.
- **Edge Functions:** Serverless logic for SSR, data validation, and scheduled tasks.
- **Registry:** Centralized configuration tables (`models`, `fields`) defining CMS behavior.

## Relevant Files

- `src/components/fields/`: Directory containing all global form components.
- `src/app/schema/`: Schema Builder and model management logic.
- `src/app/editor/`: Content Management and dynamic form engine.
- `src/utils/supabase.ts` & `src/utils/supabase-server.ts`: Standardized SSR-friendly Supabase clients.
- `src/middleware.ts`: Global session refreshing and cookie synchronization.
- `src/app/graphql/`: High-fidelity GraphQL playground implementation.
- `src/app/api/graphql/`: The production Content Delivery API (CDA) endpoint and schema generator.
- `src/utils/field-types.ts`: Source of truth for field and Postgres type mapping.
- `src/client/data-service.ts`: Centralized service for CRUD operations using native Supabase patterns.
- `docs/CDA-GUIDE.md`: Comprehensive documentation for the GraphQL CDA.
