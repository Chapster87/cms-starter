# Handoff: Breadcrumb and Reference Resolution Fix

## Current State

I have been working on ensuring that "Standings" and other reference-heavy records display friendly names (e.g., "2025 Fall") instead of UUIDs in the page heading and breadcrumbs.

### What is working:

- **Server-Side Resolution**: `src/server/records.ts` and `src/app/editor/[model]/[id]/layout.tsx` now correctly resolve references using `resolveRecordReferences`. The browser tab metadata title is correct.
- **Page Heading**: By converting `src/app/editor/[model]/[id]/page.tsx` into a Server Component, the page heading now correctly displays the friendly name (e.g., "Edit 2025 Fall").

### What is NOT working:

- **Breadcrumbs**: Still displaying truncated UUIDs (e.g., "Record 899ac00...").
- **Reference Fields in Form**: Resolving the record on the server and passing it to the client has broken the `ReferenceField` components. They now show "Select records..." instead of the selected value. This is because the form expects raw UUID strings, but is receiving resolved preview objects.

## Key Technical Details

- **Record Structure Mismatch**: Database columns use `season_id` while metadata uses `season`.
- **Reference Resolution**: `src/client/reference-resolver.ts` and `src/utils/reference-resolution.ts` were updated to handle fuzzy matching for `_id` suffixes, but this caused the form fields to receive objects instead of IDs.
- **Breadcrumb Logic**: Located in `src/components/breadcrumbs/index.tsx`. It relies on `activeRecordAtom` which is initialized in `EditRecordClient`.

## Next Steps

1.  **Fix Breadcrumbs**: Investigate why `Breadcrumbs` is not picking up the `displayName` or `activeRecord` correctly. It may need to handle the server-to-client transition better or use the same server-resolved title.
2.  **Restore Form Values**: Modify `EditRecordClient` or `RecordForm` so that reference fields still receive the raw UUIDs for their internal state while the display logic gets the friendly names.
3.  **Clean up Resolution**: Ensure that `resolveReferences` doesn't overwrite the raw ID values needed by the form components.

## Suggested Skills

- `grill-with-docs`: To challenge the resolution strategy against the existing field registry and naming conventions.
