# Handoff: Schema Routes Alignment (Models & Blocks)

This session focused on bringing the `block/` management route to functional and visual parity with the `model/` management route in the CMS schema builder.

## Completed Work

### 1. Architectural Reorganization

- **Promoted Shared Components**: Moved `field-list`, `field-modal`, and `fieldset-modal` from the local `model/[modelId]` directory to the centralized `src/app/schema/_components/` directory.
- **Cleanup**: Deleted local `_components` and the redundant `edit/` sub-route within `src/app/schema/model/[modelId]/`.

### 2. Block Hierarchy & Groups

- **Database**: Created the `block_groups` table and added `group_id` to the `blocks` table via migration (`docs/migrations/add-block-groups.sql`).
- **API**: Implemented CRUD endpoints for block groups at `/api/blocks/groups/route.ts` and updated the reorder logic in `/api/blocks/reorder/route.ts`.
- **Modals**: Created `ModalBlockGroup` and integrated it into the URL-driven `SchemaModal` system.
- **Sidebar**: Upgraded `BlockList` to use the hierarchical DND system (`useTreeDnd`), allowing blocks to be organized into folders.

### 3. Visual & UX Alignment

- **Styles**: Synchronized CSS modules so that Block and Model management pages use identical layout, padding, and typography.
- **Headers**: Updated `BlockSchemaPage` to mirror the Model page header (emoji prefix, technical ID).
- **Block Items**: Updated `BlockItemRow` to match `ModelItemRow`, including a dedicated context menu button (vertical ellipsis) and the new default brick (📦) emoji.
- **Utilities**: Added `Separator` support to the `ContextMenu` component.

## Current State

- The blocks sidebar and models sidebar are now functionally identical.
- Reordering blocks and groups persists correctly in the database.
- Shared schema-building logic is DRY and located in the shared `_components` directory.

## Known Issues / Technical Debt

- A TypeScript error in `src/app/editor/[model]/_components/modal-record.tsx` exists but is unrelated to the schema changes.
- The `index.tsx` in `BlockList` uses some `unknown` and `any` casts in the reorder payload and event handlers to bypass complex DND-kit generic type issues; these could be further refined.

## Suggested Skills

- `grill-with-docs`: Stress-test the new block grouping metadata against the overall domain model in `CONTEXT.md` and `SCHEMA.md`.
