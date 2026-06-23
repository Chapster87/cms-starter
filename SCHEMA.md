# Database Schema Registry

This document serves as the source of truth for the CMS metadata registry and system tables.

## Core Registry Tables

### `public.models`

Stores metadata for CMS models (which correspond to physical Postgres tables).

| Column                   | Type        | Description                                              |
| ------------------------ | ----------- | -------------------------------------------------------- |
| `id`                     | uuid        | Primary key.                                             |
| `table_name`             | text        | Name of the physical table in the database.              |
| `slug`                   | text        | URL-friendly identifier for the model.                   |
| `friendly_name`          | text        | Human-readable name for the UI.                          |
| `group_id`               | uuid        | Optional reference to `model_groups`.                    |
| `emoji`                  | text        | UI icon/emoji.                                           |
| `is_singleton`           | boolean     | True if the model only supports one record.              |
| `has_draft_mode`         | boolean     | Enables `status` and `_draft` columns in physical table. |
| `display_order`          | integer     | Vertical order in the sidebar/schema list.               |
| `list_columns`           | jsonb       | Array of field names to display in the Record List.      |
| `preview_columns`        | jsonb       | Array of field names to display in Reference selectors.  |
| `subtitle_column`        | text        | Field handle to display as subtitle in Reference fields. |
| `default_sort_column`    | text        | Default column to sort by in the Record List.            |
| `default_sort_direction` | text        | Default direction (`asc`/`desc`) for the Record List.    |
| `created_at`             | timestamptz | Timestamp of creation.                                   |
| `updated_at`             | timestamptz | Timestamp of last update.                                |

### `public.fields`

Stores field configurations for each model.

| Column        | Type        | Description                                                |
| ------------- | ----------- | ---------------------------------------------------------- |
| `id`          | uuid        | Primary key.                                               |
| `model_id`    | uuid        | Reference to `models.id`.                                  |
| `field_name`  | text        | Name of the column in the physical table.                  |
| `field_label` | text        | Human-readable label.                                      |
| `field_type`  | text        | CMS field type (e.g., `text_single`, `reference`).         |
| `is_required` | boolean     | Validation: cannot be null (except in drafts).             |
| `is_unique`   | boolean     | Validation: unique constraint.                             |
| `is_system`   | boolean     | True for system-managed fields (id, created_at, etc).      |
| `ui_order`    | integer     | Display order in the record form.                          |
| `settings`    | jsonb       | Field-specific configurations (placeholder, choices, etc). |
| `created_at`  | timestamptz | Timestamp of creation.                                     |
| `updated_at`  | timestamptz | Timestamp of last update.                                  |

### `public.model_groups`

Folders for organizing models in the UI.

| Column          | Type    | Description           |
| --------------- | ------- | --------------------- |
| `id`            | uuid    | Primary key.          |
| `name`          | text    | Folder name.          |
| `emoji`         | text    | Folder emoji.         |
| `display_order` | integer | Order in the tree.    |
| `type`          | text    | `schema` or `editor`. |

## Audit & System Tables

### `public.audit_logs`

Stores record-level activity history with deep diffs.

### `public.users`

CMS user profiles and role management.

### `public.media_assets`

Registry for all uploaded files (Cloudinary integration).
