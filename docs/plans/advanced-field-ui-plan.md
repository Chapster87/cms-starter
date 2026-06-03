# Handoff: Advanced Field UI - Phase 1 Implementation & Future Roadmap

This document summarizes the progress made on the Advanced Field UI suite and outlines the concrete plans for the next phase of development, including specialized metadata and rich-text editing.

## 1. Work Completed (Phase 1)

### 1.1. Unified ID & Slug Management

- **`SlugField` Component**: Implemented a reusable field that auto-syncs with a source value (like a Label or Title) until manually overridden by the user.
- **Registry Refactor**: `ModalModel` and `ModalField` now use `SlugField` for generating physical table and column names, improving the schema creation workflow.
- **Content Editor Integration**: The `seo_slug` field type in `RecordForm` now utilizes the smart `SlugField` behavior, auto-generating URLs from record titles.

### 1.2. Specialized Input Components

- **`ColorField`**: A dedicated color picker using the native browser picker, integrated into the Radix-based UI system.
- **`MarkdownField` (v1)**: Introduced a tabbed editor (Write/Preview) for `text_multi` fields. Note: Currently uses a naive regex parser; upgrade to `marked` is planned for the next session.
- **`MediaField` (v1)**: Established a visual asset grid foundation. Currently supports adding/removing external image URLs as placeholders for future Supabase Storage integration.

## 2. Technical Decisions & Standards

### 2.1. Naming Conventions

- All internal keys for composite/grouped fields (like SEO) will utilize **camelCase** for seamless frontend consumption (e.g., in Next.js `generateMetadata`).
- Physical database columns remain **snake_case**.

### 2.2. Component Architecture

- All new fields leverage the `FieldWrapper` pattern to ensure consistent labels, descriptions, and field notes.
- Fields are exported via a central index in `src/components/fields`.

## 3. Pending Tasks & Future Roadmap

### 3.1. Field Upgrades (Immediate Next Steps)

- [ ] **Upgrade Markdown**: Install `marked` and replace regex logic in `MarkdownField` to support the full markdown spec (lists, nested elements, etc.).
- [ ] **Implement `TagField`**: Create a pill-based string collection manager for keywords and categories. Stores data as a `jsonb` array of strings.
- [ ] **Implement `RichTextField` (WYSIWYG)**: Build a high-fidelity editor using **Tiptap**. Features a formatting toolbar for Headings, Bold/Italic, and Colors.

### 3.2. `SeoField` (Composite Metadata)

A specialized grouped field type (`seo_metadata`) for page-level optimization.

- **Data Structure**: Stores a single JSON object in a `jsonb` column.
- **Unified Keys**:
  - `metaTitle`
  - `metaDescription`
  - `metaKeywords` (Uses the new `TagField`)
  - `ogImage` (Uses `MediaField`)
  - `canonicalUrl`
  - `robots` (Select/Dropdown: `index, follow`, etc.)
  - `jsonLd` (JSON Editor)
- **UI**: Rendered as a collapsible Radix Accordion section within the `RecordForm`.

### 3.3. Modular Content & Blocks (Long-term)

Inspired by DatoCMS `dast`, this system will handle dynamic page components.

- **Block Registry**: A `public.blocks` table to store mini-model definitions.
- **`ModularField`**: A drag-and-drop builder for reordering block instances.
- **Vision**: Separate from SEO metadata; strictly for page layout and "component" content.

## 4. Relevant Files

- `src/components/fields/slug-field/`
- `src/components/fields/markdown-field/`
- `src/components/fields/color-field/`
- `src/components/fields/media-field/`
- `src/utils/field-types.ts`
