# Handoff: Schema Builder, Field Registry, and Unified Auth Metadata

This document summarizes the work completed to implement the CMS Schema Builder, a centralized field metadata registry, and a robust schema synchronization tool for existing database columns.

## **Note for Next Session (Field Management & Sync)**

The Schema management layer is now fully operational with metadata-driven field definitions.

- **Field Registry Layer:** All custom fields are now tracked in a `public.fields` registry table, allowing for human-friendly labels, custom UI types, and validation rules that aren't native to Postgres.
- **Atomic Schema Updates:** Field creation uses a custom RPC (`create_model_field`) that ensures physical database columns and CMS metadata are always kept in sync.
- **Schema Discovery & Sync:** Added a "Sync" tool that automatically detects existing database columns not yet managed by the CMS and allows for one-click importation into the registry.
- **Resilient Registry APIs:** Core metadata APIs (`/api/models`, `/api/models/schema/fields`) have been refactored to use system-level clients for registry lookups after verifying user authentication, bypassing RLS friction on internal CMS tables.
- **Visual Auth Status:** A new Radix UI Avatar in the header provides instant feedback on the user's session state.
- **Enhanced Record Forms:** The dynamic form engine now prioritizes registry metadata to provide specialized inputs (e.g., textareas for multi-line text) while maintaining a reliable fallback for unregistered tables.

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

### 1.2. Routing & Interface Reorganization

- **Editor Namespace (`/editor`):**
  - Created `/editor` landing page for model selection.
  - Migrated record listing, editing, and creation logic to this namespace.
  - Dedicated home for content-specific operations.
- **Schema Namespace (`/schema`):**
  - Consolidated all model/table management logic here (moved from `/models`).
  - Home for model registry dashboard and metadata settings.
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

### 1.4. Technical Fixes & Persistence

- **System Client Refactor:** APIs now use a service-role client for registry lookups to ensure the CMS remains functional regardless of user-defined RLS policies on configuration tables.
- **Auth Header Propagation:** Ensured all frontend-to-backend metadata requests correctly pass the `Authorization` header.
- **Effect Optimization:** Added timeouts and dependency tracking to `useEffect` hooks in dynamic routes to resolve cascading render warnings.
- **Upsert Refactor:** Migrated `dataService` and Registry APIs to use `.upsert()`.
- **TypeScript Hardening:** Replaced most uses of `any` with specific types or `unknown` in core metadata utilities.

### 1.5. Global Components & Drag-and-Drop

- **Global Field Components:** Created a suite of reusable, accessible field components in `src/components/fields` using Radix primitives. Includes `TextField`, `TextAreaField`, `SelectField`, `CheckboxField`, `JsonField`, `NumberField`, and `DateField`.
- **Field Wrapper Pattern:** Implemented a unified `FieldWrapper` that handles labels, required indicators, and "field notes" (inline descriptions) across all input types.
- **Global Modal System:** Implemented a centralized `Modal` component based on `@radix-ui/react-dialog` for consistent overlay experiences, replacing legacy custom modal code.
- **Drag-and-Drop Reordering:** Fully implemented DND reordering for model fields using `@dnd-kit`.
  - **Reorder API:** Created `POST /api/models/schema/fields/reorder` for batch sequential order updates.
  - **Sortable UI:** Refactored the Schema Builder's field list into a sortable list with touch support, drag handles, and smooth transitions.
  - **Dynamic Persistence:** Field order is persisted to the database and automatically reflected in the `RecordForm` rendering order.
- **Advanced Field Management & Metadata:**
  - **Unified Field Modal:** Created a reusable `FieldModal` component supporting **Create**, **Edit**, and **Duplicate** modes, replacing legacy custom modals.
  - **Full CRUD for Fields:** Implemented `PATCH` and `DELETE` handlers for field registry management, including an atomic database RPC (`drop_model_field`) to synchronize physical schema changes.
  - **Smart Duplication:** Added a "Duplicate" feature that pre-populates metadata with `(copy)` and `_copy` suffixes to speed up model definition.
  - **Professional UX:** Integrated Radix Dropdown menus for field actions and refined the styling to match professional CMS standards (DatoCMS-inspired).
  - **Internal Field Notes:** Added a `field_note` metadata column to the registry. Updated all global field components (`TextField`, `SelectField`, etc.) and the `FieldWrapper` to display these internal help notes distinct from system descriptions in the Record Form.

## 2. Current State

- The dynamic routing, form generation, and schema management are fully operational.
- System fields (`id`, `created_at`, `updated_at`) are strictly read-only on the frontend and managed by database triggers.
- All core forms (Record Editor, Schema Builder, Model Registry) now use consistent global field components.
- Field reordering is live, persisted to `public.fields.ui_order`, and utilized by the form engine.

## 3. Pending Tasks & Next Steps

- **Advanced Field UI:** Support for complex editors (Markdown, Rich Text, Image Uploaders) for the new field types.
- **Field Deletion/Archiving:** Implementation of soft-delete or physical column dropping for registered fields.
- **Model Reordering:** Apply similar DND logic to the top-level Models list.

## 4. Relevant Files

- `src/components/fields/`: Directory containing all global form components.
- `src/components/modal/index.tsx`: Centralized Radix Dialog wrapper.
- `src/app/schema/[model]/_components/field-list/index.tsx`: Main Schema Builder UI with DND context.
- `src/app/schema/[model]/_components/field-list/sortable-field-card.tsx`: Sortable item wrapper.
- `src/app/editor/[model]/_components/record-form/index.tsx`: Dynamic form engine (respects `ui_order`).
- `src/app/api/models/schema/fields/reorder/route.ts`: Batch reorder API.
- `src/utils/field-types.ts`: Centralized field mapping and definitions.

## 5. Suggested Skills

- **`grill-with-docs`:** Use this to refine the implementation plan for advanced schema management.
- **`grill-me`:** Use this to stress-test the security design of the schema management API.
