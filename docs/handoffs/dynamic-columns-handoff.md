# Handoff: Dynamic Record List Columns

This document summarizes the pivot from a "Title Template" system to a more flexible "Dynamic Record List Columns" feature.

## Objective

Empower users to configure which fields from a model appear as columns in the record list view (`/editor/[model]`). This eliminates the need for a standardized `name` field and provides a better data overview.

## Current Progress & Findings

- **Discovery Logic**: The current `getRecordDisplayName` helper (in `src/helpers/record-helpers.ts`) uses a hardcoded list of common field names. This is deemed "ugly" and needs refactoring.
- **Database Schema**: A new `SCHEMA.md` has been created in the root to document the registry tables (`models`, `fields`, etc.).
- **Pivot Decided**: We are moving away from string-based templates to a JSONB-based column configuration stored at the model level.

## The Plan

1.  **Registry Update**: Add a `list_columns` column (JSONB array of strings) to the `public.models` table.
2.  **Configuration UI**:
    - Add a "Columns" utility to the Record List top bar.
    - Allow users to toggle field visibility and reorder them.
    - Persist this state to the model's `list_columns` metadata.
3.  **Dynamic Rendering**:
    - Update `src/app/editor/[model]/page.tsx` to render table headers and cells dynamically based on `list_columns`.
    - Default behavior (if `list_columns` is empty): Show the first defined field (by `ui_order`), followed by "Status" and "Updated At".
4.  **Refactored Display Name**:
    - Update `getRecordDisplayName` to simply return the value of the first visible column defined in the model metadata.
5.  **Reference Resolution**:
    - Implement bulk-fetching for `reference` type fields when they are shown in the list.
    - Display the **first field** value of the referenced record (keep it simple).

## Suggested Skills

- `grill-with-docs`: Use this to stress-test the implementation against the new `SCHEMA.md`.

## Relevant Files

- `src/helpers/record-helpers.ts`: Contains the display name logic to be refactored.
- `src/app/editor/[model]/page.tsx`: The primary view to be updated for dynamic columns.
- `src/hooks/use-models.ts`: The hook managing model metadata.
- `src/app/api/models/route.ts`: The API route for updating model metadata.
- `SCHEMA.md`: Documentation for the database registry.

## Next Steps

0.  **SCHEMA VERIFICATION**: A full read of the live database schema (registry tables: `models`, `fields`, `model_groups`) must be performed to populate `SCHEMA.md` with actual data, as it is currently just a template.
1.  Execute SQL to add the `list_columns` column to `public.models`.
2.  Update the `ModelRegistryEntry` type definition.
3.  Implement the Column Settings utility in the Record List header.
