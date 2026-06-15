# Handoff: Audit Log Optimization & Refinement

## Context

The "Audit Log UI" task is largely complete. The system now captures and displays historical changes for records in the CMS. All key lifecycle events (Create, Auto-save/Draft Update, Publish, Unpublish) are being logged to a central `public.audit_logs` table and displayed in the **Record Details Sidebar** (right panel).

## Current Status

- **Database**: `audit_logs` table exists with a foreign key to `public.users(id)`.
- **Infrastructure**: `data-service.ts` has a `logAction` method and integrated hooks for CRUD operations.
- **UI**: `AuditLog` component is integrated into the `RecordDetailsSidebar` and is reactive to changes (auto-refreshes on `editorVersionAtom` changes).
- **Attribution**: Logs correctly resolve `display_name` and `avatar_url` from the `users` table.

## Next Session Focus: Storage Optimization

The current implementation stores a **full snapshot** of the record in the `changes` JSONB column for every event (including auto-saves every 2 seconds). This will lead to rapid database storage growth.

### Objectives for next session:

1.  **Implement Diffing Logic**: Update `logAction` in `src/client/data-service.ts` to compare the new data with the previous version and only store the changed fields.
2.  **Consolidate Auto-saves**: Consider a strategy to group or overwrite auto-save logs within the same session to avoid 100+ rows for a single editing session.
3.  **Retention Policy**: Design a strategy for pruning old logs (e.g., keep only the last 50 entries per record or entries from the last 30 days).

### Relevant Files:

- `src/client/data-service.ts`: Core logging logic.
- `src/app/editor/[model]/[id]/_components/audit-log/index.tsx`: History display.
- `src/app/editor/[model]/[id]/_components/record-details-sidebar/index.tsx`: Sidebar integration.

## Suggested Skills

- `grill-me`: To stress-test the diffing algorithm (e.g., how to handle nested JSON objects or arrays).
- `generate_explanation`: To review the current implementation before starting the optimization.

## Verification Checklist

- [x] Audit entries appear in sidebar
- [x] Avatars and names resolve correctly
- [x] Auto-save triggers a reactive UI update
- [ ] (Pending) `changes` column only contains deltas, not snapshots
