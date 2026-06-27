# Handoff: Fieldset Groupings Refinement

## Summary

The goal is to implement and refine "Fieldset Groupings" within the Model Editor (Schema) and the Record Editor. Fieldsets are visual containers (accordions) that organize fields in the UI.

### Current State

- **Database**: The `public.fieldsets` table has been created, and `public.fields` has a `fieldset_id` column. RLS is enabled with a service role policy.
- **API**:
  - `GET/POST/PATCH/DELETE` endpoints are available at `/api/models/schema/fieldsets`.
  - Reordering endpoint exists at `/api/models/schema/fieldsets/reorder`.
- **UI Components**:
  - `AlertDialog` component created in `src/components/alert-dialog`.
  - `FieldsetModal` created in `src/app/schema/[model]/_components/fieldset-modal`.
  - `SortableFieldsetCard` created in `src/app/schema/[model]/_components/field-list/sortable-fieldset-card.tsx`.
- **Logic**:
  - The `FieldList` and `RecordForm` have been updated to support interleaved ordering of top-level items (fields and fieldsets).
  - The `RecordForm` renders fieldsets as Radix Accordions.

### Issues to Resolve

1. **DND Interleaving**: The current DND implementation in `src/app/schema/[model]/_components/field-list/index.tsx` is buggy. It struggles with a single unified list for dragging fieldsets between fields. It needs a robust "interleaved" sortable context.
2. **Visual Spacing**: Spacing between fields is inconsistent. The "Ungrouped Fields" label should be removed as both fields and fieldsets are top-level items.
3. **Fieldset Styling**: Fieldset cards in the Schema Editor need to match the fidelity of the Field cards (white background, similar height, proper shadow), but with a distinct brand-color accent.
4. **Drag-into-Group**: Currently, dragging a field _into_ a fieldset visually is not implemented. The user requested the ability to drag fields into fieldsets and move fieldsets between fields.
5. **Code Cleanup**: There are several linting errors (any types, hook order) in the latest version of `src/app/schema/[model]/_components/field-list/index.tsx` that need addressing.

## Key Files

- `src/app/schema/[model]/_components/field-list/index.tsx`: Core logic for Schema Editor list.
- `src/app/schema/[model]/_components/field-list/sortable-fieldset-card.tsx`: Fieldset header UI.
- `src/app/editor/[model]/_components/record-form/index.tsx`: Core logic for Record Editor.
- `src/types/fields.ts`: Types for `CMSField` and `CMSFieldset`.
- `SCHEMA.md`: Database documentation.

## Suggested Skills

- `grill-me`: Use this to resolve the exact UX for "dragging into a group" vs "dragging between groups".
- `grill-with-docs`: Use this to verify the interleaved ordering logic against the existing DND patterns used in Model Groups.

## Next Steps

- [ ] Fix the DND implementation in `FieldList` to support a single interleaved array of IDs.
- [ ] Restyle the `SortableFieldsetCard` to match the project's high-fidelity standards.
- [ ] Remove the "Ungrouped Fields" header and fix the layout spacing.
- [ ] Implement/Fix the logic for moving fields into groups via DND or Context Menu.
