# Handoff: Reference Field Customization & Recovery

## Context

We are implementing a feature to allow users to customize which columns appear in the selection modal for Reference fields. During implementation, the project entered a "broken" state with API 500 errors and missing UI elements.

## Current Status

- **Database**: The `preview_columns` (JSONB) column was added to `public.models`.
- **Migration**: A migration script `scripts/run-migration.js` was created but encountered host resolution issues in the last attempt (DNS error).
- **API**: `/api/records/list` and `/api/records/previews` are returning **500 Internal Server Errors**.
- **UI**:
  - Reference pills are missing in the Record Edit view.
  - Selection modals show "No records found" (due to the 500 error).
  - Record List tables are still showing UUIDs instead of friendly names.
  - **Missing Interface**: The Model Editor modal (`src/app/schema/_components/schema-modal/modal-model.tsx`) is currently missing the UI to actually select and save `preview_columns`.

## Critical Issues to Resolve

1. **Fix API 500 Errors**: Debug `src/app/api/records/list/route.ts` and `src/app/api/records/previews/route.ts`.
   - _Suspects_: Type mismatches in the `resolvedRecords` loop, or issues with how `deeplyResolveMedia` is being called/awaited.
2. **Implement Preview Column UI**: Add the selection interface to `src/app/schema/_components/schema-modal/modal-model.tsx` so users can choose which fields to display in previews.
3. **Restore Reference Pills**: Fix `src/components/fields/reference-field/index.tsx` to ensure selected records render as pills in the editor view.
4. **Friendly Name Discovery**: Ensure the API returns a meaningful `display_name` (e.g., searching for `name`, `title`, `short_name`) to avoid defaulting to UUIDs in the table views.

## Relevant Artifacts

- **Migration**: `docs/migrations/0001_add_preview_columns.sql`
- **Utility**: `src/utils/media-helpers.ts` (contains `deeplyResolveMedia`)
- **SQL Rules**: `.clinerules/sql-execution.md` (updated with the Node/PSQL execution pattern)

## Suggested Skills

- `grill-with-docs`: Use this to stress-test the API logic against the current field metadata.
- `browser_action`: Use this to capture the exact console errors when the 500 occurs.

## Technical Debt / Notes

- The `psql` connection string in `scripts/run-migration.js` uses `db.knqlsiuhdcflazlnefob.supabase.co`. If DNS fails, the user may need to provide a direct IP or check network restrictions.
