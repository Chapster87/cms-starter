# Blocks & Structured Text Implementation Plan

## 1. Overview

This plan outlines the implementation of "Blocks" in the CMS. Blocks are configurable groups of fields that can be composed within "Modular Content" and "Structured Text" field types. Unlike Models, Blocks do not correspond to standalone physical database tables; their data is stored as structured JSON within a host record's JSONB column.

## 2. Database Schema Changes

### 2.1. New Table: `public.blocks`

Stores the metadata for reusable blocks.

```sql
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  api_id text NOT NULL UNIQUE,
  emoji text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER set_blocks_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### 2.2. Modified Table: `public.fields`

Updates the fields registry to support polymorphic association with either a Model or a Block.

```sql
-- 1. Add block_id column
ALTER TABLE public.fields ADD COLUMN block_id uuid REFERENCES public.blocks(id) ON DELETE CASCADE;

-- 2. Make model_id nullable
ALTER TABLE public.fields ALTER COLUMN model_id DROP NOT NULL;

-- 3. Add polymorphic constraint
ALTER TABLE public.fields ADD CONSTRAINT field_parent_check
  CHECK ((model_id IS NOT NULL AND block_id IS NULL) OR (model_id NULL AND block_id IS NOT NULL));

-- 4. Create index for performance
CREATE INDEX idx_fields_block_id ON public.fields(block_id);
```

## 3. TypeScript & Type Safety

### 3.1. Registry Updates

- Update `CMSField` interface to include optional `block_id`.
- Update `CMSFieldSettings` to include:
  - `allowed_blocks`: `uuid[]`
  - `allow_multiple`: `boolean`
  - `min_blocks`/`max_blocks`: `number`

### 3.2. Structured Text (ProseMirror)

Structured Text will utilize a ProseMirror JSON schema via Tiptap.

- **Node Type:** `cmsBlock`
- **Attributes:** `id`, `blockType`, `data`.
- **Storage:** Stored as JSONB in the database to allow native rendering and future-proofing against HTML-only lock-in.

## 4. UI/UX Patterns

### 4.1. Schema Builder

- **Blocks Tab:** Integrated into the schema sidebar.
- **Contextual Actions:** "New Block" and "Add Group" (filtered for block types) available when the Blocks tab is active.

### 4.2. Record Form (Modular Content)

- **Stacked Accordion:** Blocks will be rendered as a vertical stack of collapsible items.
- **DND Support:** Reordering via `@dnd-kit`, matching the fieldset reordering pattern.
- **Global Pattern:** Create a `CollapsibleDndWrapper` component in `src/components` to standardize this pattern for both Fieldsets and Blocks.

## 5. Implementation Phases

### Phase 1: Infrastructure

- [ ] Document ProseMirror decision in `CONTEXT.md`.
- [ ] Execute SQL migrations for `blocks` and `fields`.
- [ ] Update registry types and services.
- [ ] Implement Sidebar & Block CRUD.
- [ ] Update Field Modal to handle Block associations.
- [ ] Develop `CollapsibleDndWrapper` component.

### Phase 2: Content Types

- [ ] Implement `ModularContentField` component.
- [ ] Implement `StructuredTextField` (Tiptap JSON + `cmsBlock` extension).
- [ ] Create `StructuredTextRenderer` for frontend/CDA use.

### Phase 3: Conversions

- [ ] Migrate `standings_table` field type to a Block-based implementation.
- [ ] Clean up legacy advanced field types.

## 6. CDA (GraphQL) Impact

- Modular Content fields will resolve to an array of objects, each containing its block type and associated data.
- Structured Text will expose both raw JSON and potentially a pre-rendered HTML string for simpler consumers.
