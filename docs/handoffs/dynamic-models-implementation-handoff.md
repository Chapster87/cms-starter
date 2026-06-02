# Handoff: Schema Builder, Field Registry, and Unified Auth Metadata

This document summarizes the work completed to implement the CMS Schema Builder, a centralized field metadata registry, and a robust schema synchronization tool for existing database columns.

## **Note for Next Session (URL-Driven Modals & State Sync)**

The Schema management layer has been refactored into a modern, reactive, URL-driven architecture.

- **URL-Driven SchemaModal:** All model and field management actions (Create, Edit, Duplicate) are now handled by a centralized `SchemaModal` switcher that responds to query parameters (e.g., `?action=new-field`). This allows for deep-linking and a cleaner browser history.
- **Zero-Prop Architecture:** Forms (`ModalModel`, `ModalField`) are now self-contained, fetching their own data and auth state. This eliminated significant prop-drilling.
- **Global State Synchronization:**
  - **Models:** The `useModels` hook now uses a global listener pattern to sync registry changes across all components (sidebar, dashboard, etc.) instantly.
  - **Fields:** A custom `schema-update` event system ensures the `FieldList` refreshes automatically after any modal action without a page reload.
- **Intelligent ID Generation:** Technical IDs (Table names, Column names) are auto-derived from Friendly Names/Labels but "detach" once manually edited, preserving user overrides.
- **Smart Duplication:** Duplication now pre-fills fields with ` (copy)` and `_copy` suffixes for both models and individual fields.

# Handoff: Dynamic Models, Routing Reorganization, and Persistence Refactor

- **Separation of Routing Concerns:** Routes are now split into `/editor` (Content Management/Record editing) and `/schema` (Model & Table Definitions).
- **Upsert-First Persistence:** All record updates now leverage Supabase's `.upsert()` method via the `dataService`, ensuring atomic and reliable persistence.
- **Icon Stability:** Navigation icons in the header now use absolute paths (`/feather-sprite.svg`) to ensure they remain visible across dynamic route transitions.
- **Effect Decoupling:** Client-side data fetching in dynamic routes now uses `setTimeout` to move state updates out of the synchronous render cycle, resolving cascading render warnings.
- **Declarative Navigation:** Refactored several excessive uses of the `useRouter` hook to prefer `<Link>` components, improving performance via prefetching.
- **Native Supabase Migration:** Completely refactored the data layer to use the native Supabase client (PostgREST) instead of GraphQL for better reliability and simplicity.
- **Centralized Authentication:** Created `useAuth` hook (`src/hooks/use-auth.ts`) to unify session management and access tokens across the app.
- **Centralized Data Service:** Implemented `dataService` (`src/client/data-service.ts`) to handle all CRUD operations using native Supabase patterns.
- **Model Registry System:** Implemented a `models` configuration table to manage Friendly Names, editable URL slugs, and Singleton status.

## 1. Work Completed

### 1.1. Schema Builder & Field Management

- **Field Registry Table:** Implemented `public.fields` to track metadata like `field_label`, `field_type`, and `is_required`.
- **Atomic Creation API:** Built `POST /api/models/schema/fields` which leverages a `SECURITY DEFINER` RPC to safely update both database schema and CMS metadata in one transaction.
- **Schema Synchronization:** Created a detection and import mechanism (`/api/models/schema/fields/sync`) to bring pre-existing database columns into the CMS management layer.
- **Centralized Mapping:** Established `src/utils/field-types.ts` as the single source of truth for mapping CMS types to physical Postgres types.
- **Centralized SchemaModal:** Replaced local `FieldModal` with a global, URL-driven `SchemaModal` hosted in the shared layout.

### 1.2. Routing & Interface Reorganization

- **Editor Namespace (`/editor`):**
  - Created `/editor` landing page for model selection.
  - Migrated record listing, editing, and creation logic to this namespace.
  - Dedicated home for content-specific operations.
- **Schema Namespace (`/schema`):**
  - Consolidated all model/table management logic here (moved from `/models`).
  - Home for model registry dashboard and metadata settings.
  - **Auto-Redirection:** The `/schema` root now automatically redirects to the first available model for a smoother workflow.
- **Navigation Update:**
  - Updated global Header with "Content" (pointed to /editor route) and "Schema" links.

### 1.2. Backend / API

- **Native Refactor:** Migrated all model management and record fetching logic from GraphQL to native Supabase client calls.
- **Model Registry Table:** Created the `models` table in Supabase to act as a metadata registry for content types.
- **Model Management API (`src/app/api/models/route.ts`):**
  - Updated to support metadata like `friendly_name`, `slug`, and `is_singleton`.
  - Implemented auto-incrementing `display_order`.
  - Added re-indexing logic to maintain sequential order after deletions.
- **Supabase RPC Security:** Refactored database functions (`drop_table`, `create_table`, etc.) with `SECURITY DEFINER` to allow authenticated users to manage schema without being superusers.
- **RLS Automation:** Updated table creation logic to automatically enable Row Level Security and create default access policies for new models.

### 1.3. Frontend / UI

- **DatoCMS-Inspired Field List:** Replaced the simple grid with a professional vertical stack featuring category-coded icons and status badges.
- **Model Landing Pages:** Created dedicated hubs at `/schema/[model]` to separate field management from core model metadata settings.
- **Auth Status Indicator:** Integrated `@radix-ui/react-avatar` in the header to show user status (LoggedIn/LoggedOut/Loading).
- **Metadata-Driven Dashboard:** The Models management screen now displays human-readable "Friendly Names" and URL slugs instead of raw table names.
- **Enhanced Record Form:** Updated to prioritize CMS labels and types, with automatic fallback for unregistered physical columns.
- **Sidebar Navigation:** Integrated the `ModelList` into a persistent sidebar layout for the `/schema` section.

### 1.4. Technical Fixes & Persistence

- **System Client Refactor:** APIs now use a service-role client for registry lookups to ensure the CMS remains functional regardless of user-defined RLS policies on configuration tables.
- **Auth Header Propagation:** Ensured all frontend-to-backend metadata requests correctly pass the `Authorization` header.
- **Effect Optimization:** Added timeouts and dependency tracking to `useEffect` hooks in dynamic routes to resolve cascading render warnings.
- **Upsert Refactor:** Migrated `dataService` and Registry APIs to use `.upsert()`.
- **TypeScript Hardening:** Replaced most uses of `any` with specific types or `unknown` in core metadata utilities.

### 1.5. Global Components & Drag-and-Drop

- **Global Field Components:** Created a suite of reusable, accessible field components in `src/components/fields` using Radix primitives. Includes `TextField`, `TextAreaField`, `SelectField`, `CheckboxField`, `JsonField`, `NumberField`, and `DateField`.
- **Field Wrapper Pattern:** Implemented a unified `FieldWrapper` that handles labels, required indicators, and "field notes" (inline descriptions) across all input types.
- **Global Modal System:** Implemented a centralized `Modal` component based on `@radix-ui/react-dialog` for consistent overlay experiences.
- **Drag-and-Drop Reordering:** Fully implemented DND reordering for model fields using `@dnd-kit`.
  - **Reorder API:** Created `POST /api/models/schema/fields/reorder` for batch sequential order updates.
  - **Sortable UI:** Refactored the Schema Builder's field list into a sortable list with touch support, drag handles, and smooth transitions.
  - **Dynamic Persistence:** Field order is persisted to the database and automatically reflected in the `RecordForm` rendering order.
- **Advanced Field Management & Metadata:**
  - **Unified Schema Modal:** Created reusable `ModalModel` and `ModalField` components supporting **Create**, **Edit**, and **Duplicate** modes.
  - **Full CRUD for Fields:** Implemented `PATCH` and `DELETE` handlers for field registry management, including an atomic database RPC (`drop_model_field`) to synchronize physical schema changes.
  - **Smart Duplication:** Added a "Duplicate" feature that pre-populates metadata with `(copy)` and `_copy` suffixes to speed up model and field definition.
  - **Professional UX:** Integrated Radix Dropdown menus for field actions and refined the styling to match professional CMS standards (DatoCMS-inspired).

## 2. Current State

- The dynamic routing, form generation, and schema management are fully operational.
- System fields (`id`, `created_at`, `updated_at`) are strictly read-only on the frontend and managed by database triggers.
- All core forms (Record Editor, Schema Builder, Model Registry) now use consistent global field components.
- Field reordering is live, persisted to `public.fields.ui_order`, and utilized by the form engine.

## 3. Pending Tasks & Next Steps

- **Two-Step Field Creation:** [COMPLETED] Users now choose from a visual grid of field types before entering configuration details.
- **Field-Specific Settings:** Add advanced configuration for certain types (e.g., number ranges, regex validation for text).
- **UI Consolidation:** [COMPLETED] Move model action buttons into a context menu (Radix Dropdown) to reduce clutter. Link "Fields & Settings" directly to the model name click.
- **Model Reordering:** Apply similar DND logic to the top-level Models list (sidebar/dashboard).
- **Blocks System:** Eventually add `[blocks]` routes to the `/schema` namespace for component-based schema definitions.
- **Advanced Field UI:** Support for complex editors (Markdown, Rich Text, Image Uploaders).
- **Implement Quality Project README.md** - want to have a professional grade explanation of all project functionality and explanation of configuration and use.

## 4. Relevant Files

- `src/components/fields/`: Directory containing all global form components.
- `src/app/schema/_components/schema-modal/`: Centralized modal logic and form components.
- `src/hooks/use-models.ts`: Global singleton hook for registry state management.
- `src/app/schema/[model]/_components/field-list/index.tsx`: Main Schema Builder UI with DND context.
- `src/app/editor/[model]/_components/record-form/index.tsx`: Dynamic form engine (respects `ui_order`).
- `src/utils/field-types.ts`: Centralized field mapping and definitions.

## 5. Suggested Skills

- **`grill-with-docs`:** Use this to refine the implementation plan for advanced schema management.
- **`grill-me`:** Use this to stress-test the security design of the schema management API.
