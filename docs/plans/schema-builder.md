# Task Specification: Schema Builder Configuration Layer & Field Creation API

## Overview

We are building a custom headless CMS using Next.js (App Router) and Supabase. The architecture is explicitly split into:

- `/editor`: Content Management
- `/schema`: Table and Structural Management

### Goal

Implement the metadata management system for individual table fields (columns) and build the API infrastructure to programmatically append new columns to existing user-defined models based on a UI selection.

---

## 1. Context & Setup (Manual SQL Steps)

The following database modifications must be executed manually via the Supabase SQL Editor. Verify these elements exist before interacting with the API layer.

### 1.1 Registry Table

A `public.fields` registry table tracks structural metadata that Postgres doesn't natively expose (e.g., human-friendly labels, UI configurations, ordering).

```sql
CREATE TABLE IF NOT EXISTS public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.models(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- The physical Postgres column name (snake_case)
  field_label TEXT NOT NULL, -- The UI display name (e.g., "Featured Image")
  field_type TEXT NOT NULL, -- CMS field type string
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  ui_order INT DEFAULT 0, -- For drag-and-drop order
  settings JSONB DEFAULT '{}'::jsonb, -- Extra config (allowed blocks, validation rules)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(model_id, field_name)
);
```

### 1.2 DDL Alteration RPC Function

A `SECURITY DEFINER` function handles executing dynamic DDL operations securely, utilizing standard PostgreSQL formatting to sanitize identifiers.

```sql
CREATE OR REPLACE FUNCTION public.add_column_to_table(
  p_table_name TEXT,
  p_column_name TEXT,
  p_data_type TEXT,
  p_is_nullable BOOLEAN DEFAULT true,
  p_is_unique BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'ALTER TABLE public.%I ADD COLUMN %I %s %s %s',
    p_table_name,
    p_column_name,
    p_data_type,
    CASE WHEN NOT p_is_nullable THEN 'NOT NULL' ELSE '' END,
    CASE WHEN p_is_unique THEN 'UNIQUE' ELSE '' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 2. Type Definitions

Define core types in `src/types/fields.ts` to handle CMS field types:

```typescript
export type CMSFieldType =
  | "text_single" // text (Single-line Input)
  | "text_multi" // text (Markdown / Rich-text Block)
  | "number" // numeric (Integers or Floats)
  | "boolean" // boolean (Switches / Toggles)
  | "date_time" // timestamptz (Date pickers)
  | "color" // text (Hex or RGBA pickers)
  | "seo_slug" // text (Unique constraint, automatic frontend sluggification)
  | "media" // jsonb (Array of references to uploaded assets)
  | "json" // jsonb (Raw Metadata block or custom data payload)
  | "modular_content" // jsonb (Dynamic block layouts)
```

---

## 3. Backend API Implementation

**Route:** `src/app/api/models/schema/fields/route.ts`

### POST Workflow Architecture

1.  **Payload Extraction & Parsing:**
    - Validate `model_id`, `field_name` (snake_case), `field_label`, and `field_type`.
2.  **Postgres Type Resolution:** Map `CMSFieldType` to DB types:
    - `text_single`, `text_multi`, `color`, `seo_slug` -> `text`
    - `number` -> `numeric`
    - `boolean` -> `boolean`
    - `date_time` -> `timestamptz`
    - `media`, `json`, `modular_content` -> `jsonb`
3.  **Database Modification:**
    - Call `add_column_to_table` RPC via service-role client.
4.  **Registry Registration:**
    - Insert metadata row into `public.fields`.
5.  **Fault Isolation:**
    - Use rigid error catching.
    - Roll back or ensure no orphaned registry entries if DDL fails.

---

## 4. Engineering & Style Guidelines

- **Response Contracts:** Return `201 Created` with the new field schema object on success.
- **Declarative Patterns:** Prefer explicit declarative routing.
- **Theming:** Use CSS variables from `src/styles/variables.css`.
- **Indentation:** 2 spaces (no tabs).
- **Naming:** `camelCase` for JS/TS, `snake_case` for DB columns.
