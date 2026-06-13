# Implementation Plan: User Roles & Permissions

## 1. Overview

Implement a comprehensive Role-Based Access Control (RBAC) system for the Custom CMS. This system distinguishes between technical authentication (Auth), CMS identity/permissions (Users), and content attribution (Authors).

## 2. Core Architecture

### 2.1 Entity Relationship Model

- **Auth (Supabase `auth.users`)**: Handles login, JWTs, and secure sessions.
- **Users (`public.users`)**: CMS-specific user profile.
  - Linked 1:1 with Auth via `id`.
  - Stores `role` (string) and `status`.
  - Managed via a new "Site Settings" area.
- **Roles & Permissions**: Hardcoded mapping (initially) for velocity.
  - `admin`: Full system access, including schema and user management.
  - `editor`: Access to all content editing, but no schema/user management.
  - `author`: Access to editing content; specifically records they created or are assigned to.
- **Authors (`public.authors`)**: Content entity managed within the CMS.
  - Optional `user_id` link to `public.users`.
  - Allows for guest authors (no login) or CMS-linked authors (linked to user profile).
  - Can sync name/avatar from linked Google profile.

### 2.2 System Metadata

All CMS-managed physical tables will be updated to include:

- `created_by`: UUID of the user who created the record.
- `updated_by`: UUID of the user who last updated the record.

## 3. Implementation Phases

### Phase 1: Database & Schema

- [x] Create `public.users` table with standard fields (`email`, `role`, `status`).
- [x] Add `user_id` FK to the existing `authors` table.
- [x] Implement database triggers to auto-provision `public.users` records on first sign-in (for Google OAuth users).
- [x] Update schema migration logic to automatically include `created_by` and `updated_by` on all new models.
- [x] Fix RLS recursion bug via `is_admin()` Security Definer function.

### Phase 2: Permissions Engine

- [x] Create `src/utils/permissions.ts` to define hardcoded role capabilities.
- [x] Implement server-side middleware/helpers to check permissions before executing RPCs or API calls.
- [x] Add logic to block `exec_sql` and schema-modifying routes for non-admins.

### Phase 3: Site Settings & User Management UI

- [x] Create `/settings` top-level route with a sidebar (similar to `/editor` and `/schema`).
- [x] Implement `/settings/users` page:
  - [x] Table view of all CMS users (with Name/Avatar).
  - [x] "Edit User" modal: Update role, status, name, and avatar.
  - [x] "Add User" modal: Email, Role, and manual password entry.
  - [x] Integration with Supabase Admin API (`auth.admin.createUser`) to set up accounts without mandatory email verification.
- [x] Update main navigation to include the "Settings" link.
- [x] Unify Settings layout/styling with Editor.

### Phase 4: Author Enhancements

- [x] Update the Author model in the CMS to include the user_id connection field.
- [x] Enable draft mode for Authors model.
- [x] Implement UI for syncing Google profile data (name, avatar) to the Author record.
  - Features proactive auto-sync on linking and manual "Sync from User Profile" button.
- [x] Update Record Lists to display the `created_by` user or assigned Author.
- [x] Implement row-level Context Menu for users (Edit/Delete).
- [x] Prevent self-deletion of active user.
- [x] Enable `users` table as a virtual referenceable model in the CMS.
- [x] Refine Reference Field UI for User records (User icon, suppressed slug/status labels).
- [x] Ensure `created_by` and `updated_by` are hidden from all UI management screens.
