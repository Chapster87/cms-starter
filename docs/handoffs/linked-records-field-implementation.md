# Handoff: Linked Records Field Implementation

This document summarizes the work performed to implement the **Linked Record (Reference) Field Type** and outlines the remaining issues with the browse dialog data population.

## 1. Work Completed

### 1.1 Schema & Metadata

- **New Field Type:** Added `reference` to `CMSFieldType` in `src/types/fields.ts`.
- **Registry Integration:** Updated `src/utils/field-types.ts` to map `reference` to the `jsonb` database type.
- **API Persistence:** Refactored `POST/PATCH /api/models/schema/fields` to correctly persist the `settings` JSONB payload (stores `allowed_models` and `allow_multiple`).

### 1.2 UI Components

- **`ReferenceField`:** Created a new professional-grade field component in `src/components/fields/reference-field/`.
  - Features a pill-based selection UI for linked records.
  - Supports single and multiple selection modes.
  - Uses a **Sanity-inspired Browse Dialog** (Radix UI Modal) for record selection.
- **`ModalField` Update:** Enhanced the field configuration modal to allow admins to select which models (e.g., Pages, Authors) a reference field can link to.
- **`RecordForm` Integration:** Fully integrated the new field into the dynamic form engine.

### 1.3 Backend Support

- **`POST /api/records/list`:** Aggregates records from multiple target tables with intelligent column resolution (prefers `friendly_name`, `title`, or `name`).
- **`POST /api/records/previews`:** Hydrates record IDs into human-readable labels for the UI pills.
- **`POST /api/records/search`:** (Legacy) Simple search endpoint for initial prototyping.

## 2. Current Status & Known Issues

### 2.1 The "Empty Dialog" Bug

Despite several attempts to fix the model resolution logic in the `List API`, the user reports that the **"Select Records" dialog still shows "No records found"** even when the target model (e.g., "Page") is enabled and contains data.

- **Current Theory:** The `List API` is failing to correctly resolve the model metadata from the `allowed_models` array provided by the frontend.
- **Last Change:** Switched to fetching all models and filtering in JS to avoid PostgREST query issues.
- **Observation:** Console logs in the browser show the `ReferenceField` is sending the correct UUID, but the API returns `[]`.

### 2.2 Console Warnings Cleaned

- Fixed Radix UI "Missing Description" warning in `src/components/modal/index.tsx`.
- Fixed Tiptap "Duplicate extension" warning in `src/components/fields/rich-text-field/index.tsx`.

## 3. Next Steps for Clean Agent

1.  **Debug the List API:** Focus on `src/app/api/records/list/route.ts`. Verify why the filter on line 51-54 is not matching the models being passed from the frontend.
2.  **Verify DB Schema:** Ensure the RPC `get_table_columns` is returning the expected results for the tables being queried.
3.  **UI Feedback:** Ensure the `ReferenceField` correctly handles the case where `allowedModels` is empty or undefined.

## 4. Relevant Files

- `src/app/api/records/list/route.ts` (Likely source of the bug)
- `src/components/fields/reference-field/index.tsx`
- `src/app/schema/_components/schema-modal/modal-field.tsx`

## 5. Suggested Skills

- **`grill-with-docs`**: To stress-test the relational model against the current Supabase schema.
