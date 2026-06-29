# Database Functions Reference

This document lists and describes the custom Postgres functions available in the Supabase `public` schema. These functions are used for schema management, automation, and core CMS logic.

## Utility Functions

### `update_updated_at_column()`

- **Purpose**: Automatically updates the `updated_at` column to the current timestamp.
- **Usage**: Typically used in a `BEFORE UPDATE` trigger on tables with an `updated_at` column.
- **Example**:
  ```sql
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.your_table
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  ```

### `exec_sql(sql text)`

- **Purpose**: Executes arbitrary SQL strings. This is a high-privilege function used by the CMS and migrations to perform schema changes.
- **Security**: Defined as `SECURITY DEFINER` to allow schema modifications from the API.

## Registry & Schema Management

### `create_model_field(...)`

- **Purpose**: Internal function used by the Schema Builder to synchronize CMS metadata with physical table columns.

### `drop_model_field(...)`

- **Purpose**: Internal function used to remove a field from both the CMS registry and the physical table.

### `create_table_with_uuid_and_timestamp(...)`

- **Purpose**: Standardizes the creation of new physical tables for models, ensuring they include `id` (UUID), `created_at`, and `updated_at` columns by default.

### `drop_table(...)`

- **Purpose**: Safely removes a project table and its associated CMS metadata.

### `get_table_columns(t_name text)`

- **Purpose**: Returns a list of column names and types for a specific table. Used for schema discovery and synchronization.

### `get_user_tables()`

- **Purpose**: Returns a list of all tables in the `public` schema that are managed by the user (excluding system and registry tables).

## User & RBAC

### `handle_new_user()`

- **Purpose**: Trigger function for `auth.users` to automatically create a profile in `public.users` when a new user signs up.

### `handle_updated_at()`

- **Purpose**: Similar to `update_updated_at_column`, but specifically named for user profile triggers.

### `is_admin(user_id uuid)`

- **Purpose**: Helper function to check if a specific user has the 'admin' role. Returns `boolean`.

---

_Note: This list was manually compiled on 2026-06-28. For a live list, query `information_schema.routines` where `routine_schema = 'public'`._
