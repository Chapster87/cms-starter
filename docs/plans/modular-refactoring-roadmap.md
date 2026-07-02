# Modular Refactoring Roadmap

This document outlines the plan for modularizing "God Components" and high-complexity areas of the ForgeCMS codebase, following the project's **Modular First** and **Registry Pattern** architectural guidelines.

## 1. Schema Management: `ModalField` Refactor (COMPLETED)

**Target:** `src/app/schema/_components/schema-modal/modal-field.tsx` (Refactored from ~935 lines to ~130 lines)

### Current Issues:

- Single-file management of every possible field type. (FIXED)
- Bloated state for validation, appearance, and specific field logic. (FIXED)
- Massive conditional rendering blocks. (FIXED)

### Plan:

1.  [x] **Extract Tab Components**: Move content of "Basic", "Validation", and "Appearance" tabs into local `_components/field-settings/`.
2.  [x] **Field-Specific Settings Registry**: Implement a local registry for field-specific configuration (reusing the pattern from `FieldModal`).
3.  [x] **Logic Hook**: Create `useFieldForm` to handle state management, input handling, and form submission logic.

---

## 2. Content Editor: `RecordForm` Refactor (COMPLETED)

**Target:** `src/app/editor/[model]/_components/record-form/index.tsx` (Refactored from ~800 lines to ~550 lines)

### Current Issues:

- The `renderField` function is a massive `if/else` ladder. (FIXED)
- Mixes UI layout (Accordion/Fieldsets) with complex field resolution logic. (FIXED)
- Difficult to add new field types without bloating the file. (FIXED)

### Plan:

1.  [x] **Field Renderer Registry**: Create a centralized registry (`field-registry.tsx`) where each `field_type` defines its own rendering component.
2.  [x] **Local Field Renderers**: Move individual field rendering logic to `src/app/editor/[model]/_components/record-form/field-renderers.tsx`.
3.  [x] **Refactor State Orchestration**: Delegate field-level validation and change handling to the specialized renderer components.

---

## 3. Schema Builder: `FieldList` DND Refactor (COMPLETED)

**Target:** `src/app/schema/_components/field-list/index.tsx` (Refactored from ~750 lines to ~550 lines)

### Current Issues:

- Mixes complex `@dnd-kit` orchestrations with CRUD UI. (FIXED)
- Recursive rendering logic for Fieldsets and Fields is tightly coupled. (FIXED)

### Plan:

1.  [x] **DND Hook**: Extract all drag-and-drop event handling and sensor setup into a custom `useFieldDnd` hook (standardized via global `useDndSensors`).
2.  [x] **Extract Row Components**: Create `FieldsetGroup` and `FieldListHeader` sub-components in a local `_components` folder.
3.  [x] **Simplify List Management**: Main component now focuses on high-level state and orchestration.

---

## 4. Field Suite: `StructuredTextField` Refactor

**Target:** `src/components/fields/structured-text-field/index.tsx` (~622 lines)

### Current Issues:

- Manages TipTap initialization, custom extensions, toolbar UI, and block selection in one file.
- Very high cognitive load for maintaining the editor interface.

### Plan:

1.  **TipTap Setup Utility**: Move extension configurations and editor setup to a dedicated helper.
2.  **Toolbar Sub-component**: Extract the rich text toolbar and its interaction logic.
3.  **Block Management**: Move the "Insert Block" modal and logic to a specialized sub-component.

---

## 5. Architectural Quality Guardrails (Ongoing)

- **Zero-Prop Pattern**: Continue favoring components that manage their own state/data fetching where appropriate.
- **Feature Hooks**: Proactively extract logic from `.tsx` files into local `.ts` hooks files.
- **Directory Scoping**: Maintain the `_components`, `_data`, `_hooks` structure within feature folders to keep the root cleaner.
