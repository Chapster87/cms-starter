# Handoff: Model Grouping and DND Nesting

## Status

The core infrastructure and **Drag-and-Drop (DND) nesting functionality are now fully operational in the Schema view**. Users can reorder items vertically and nest models into groups via horizontal indentation. The UI has been polished to match the `navigation-field` standard.

## Work Completed

- **Database & API**:
  - Full CRUD for model groups.
  - Bulk reordering API persists `display_order` and `group_id`.
  - Updated `POST/PATCH /api/models` to support manual group assignment via modal.
- **UI Components**:
  - **Accordion Logic**: Groups support expand/collapse state in both **Schema** and **Editor** views.
  - **Dynamic Indentation**: (Schema) Dashed border placeholders correctly indent in real-time based on horizontal cursor movement.
  - **Indentation Guides**: Vertical "ghost paths" provide clear visual hierarchy in both views.
  - **Refined Layout**: Emojis are used as primary icons; Sidebar items align with the schema view's visual language.
- **State Management**:
  - `useModels` handles unified models/groups state.
  - `ModelList` manages real-time "neighbor-aware" depth calculation during drags.

## Recent Fixes

1.  **Placeholder Nesting**: Refactored `ModelItemRow` to use `marginLeft` on the root `li` and a nested `.itemCard`. This ensures the entire dashed box indents when nesting.
2.  **Neighbor Context Bug**: Updated the render loop to calculate `maxDepth` based on the item currently being hovered (`overId`), allowing unnested items to immediately show nested paths when moved below a folder.
3.  **Accordion filtering**: Implemented a filtering layer in the `ModelList` `useMemo` to skip rendering children of collapsed groups.

## Relevant Files

- `src/app/schema/_components/model-list/index.tsx`: Main DND implementation, neighbor-aware logic, and accordion state.
- `src/app/schema/_components/model-list/model-item-row.tsx`: Row rendering, caret icons, and indentation logic.
- `src/app/schema/_components/model-list/style.module.css`: DND specific styles (placeholder, overlay, guides).
- `src/app/editor/_components/model-sidebar/index.tsx`: Sidebar implementation with migrated accordion logic and indentation guides.
- `src/app/editor/_components/model-sidebar/style.module.css`: Migrated styles for the editor sidebar.
- `src/app/schema/_components/schema-modal/modal-model.tsx`: Manual group selection utility.

## Next Steps for the Fresh Agent

1.  **Refactor Schema ModelList**: `src/app/schema/_components/model-list/index.tsx` has grown large (350+ lines) and complex due to DND logic, tree flattening, and state management. It needs to be refactored for readability. Consider:
    - Extracting DND handlers into a custom hook.
    - Separating the tree visibility/filtering logic.
    - Breaking down the large `handleDragEnd` function.
2.  **State Sync**: Consider if accordion state (collapsed groups) should be shared between the Schema view and Editor sidebar via a global store or sync mechanism.

## Reference

The implementation now closely follows `src/components/fields/navigation-field/index.tsx` but with specialized handling for model metadata.
