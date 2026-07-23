# Audit: New Record Creation and Draft Status (#35)

## Summary of Findings

The current mechanism for creating new records in ForgeCMS is robust regarding initial state but purposely restrictive for auto-saving.

### 1. Initial State and Status

- **Placeholder ID**: New records use the placeholder `'new'` in the URL.
- **Server-Side Templates**: The server (`dataService.ts`) provides a template object for new records.
- **Draft Initialization**: If a model has `has_draft_mode: true`, the template correctly initializes `status: 'draft'` and `_draft: true`. This ensures new records enter the system as drafts by default.
- **Non-Draft Models**: For models without draft mode, these fields are omitted or handled by database defaults.

### 2. Auto-save Restriction

- **Current Behavior**: Auto-save is explicitly disabled in `EditRecordClient.tsx` for new records (`isNew === true`).
- **Reasoning**: To prevent creating "ghost" records in the database as soon as a user starts typing. A record only earns its ID after the first manual "Save" or "Publish" action.
- **User Impact**: If a user's browser crashes or they navigate away before the first manual save, all progress is lost on a new record.

### 3. Draft Mode Consistency

- The system correctly distinguishes between the initial creation of a draft and the publishing of that draft.
- The `status` field is used consistently as the primary indicator for the UI.

## Recommendations

### 1. "Silent" Initial Save (Optional)

To improve UX, we could consider a "silent" initial save once a certain threshold of data is entered (e.g., a required title field), effectively converting the `'new'` state to a real ID early. However, this introduces complexity in URL management (redirecting from `/new` to `/[id]`).

### 2. Local Storage Backup

Implement a local storage backup for new records. If a user returns to a `/new` URL for a specific model, we can check if they have unsaved work from a previous session and offer to restore it.

### 3. Status Field Visibility

Ensure the "Draft" status is clearly visible even during creation, so the user knows they are working on a non-public version.

## Action Items (to be graduated to tickets)

1. Investigate local storage backup for records in the `'new'` state.
2. Verify that the UI correctly displays the "Draft" status during the initial creation flow for models with draft mode enabled.
