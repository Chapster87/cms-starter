import { User } from "@supabase/supabase-js"

/**
 * Definition of user roles in the CMS.
 */
export type UserRole = "admin" | "editor" | "author"

/**
 * Interface for permission definitions.
 */
export interface Permissions {
  /** Can edit the system schema (models, fields) */
  canEditSchema: boolean
  /** Can manage CMS users and roles */
  canManageUsers: boolean
  /** Can create new records */
  canCreateRecords: boolean
  /** Can edit existing records */
  canEditRecords: boolean
  /** Can delete records */
  canDeleteRecords: boolean
  /** Can publish/unpublish records (if draft mode is enabled) */
  canPublishRecords: boolean
}

/**
 * Hardcoded mapping of roles to their specific permissions.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permissions> = {
  admin: {
    canEditSchema: true,
    canManageUsers: true,
    canCreateRecords: true,
    canEditRecords: true,
    canDeleteRecords: true,
    canPublishRecords: true,
  },
  editor: {
    canEditSchema: false,
    canManageUsers: false,
    canCreateRecords: true,
    canEditRecords: true,
    canDeleteRecords: true,
    canPublishRecords: true,
  },
  author: {
    canEditSchema: false,
    canManageUsers: false,
    canCreateRecords: true,
    canEditRecords: true, // @TODO: Restrict to own records via middleware/RLS
    canDeleteRecords: false,
    canPublishRecords: false, // Authors can only draft
  },
}

/**
 * Checks if a role has a specific permission.
 * @param role The user's role.
 * @param permission The permission key to check.
 * @returns boolean
 */
export function hasPermission(
  role: UserRole | string | undefined,
  permission: keyof Permissions
): boolean {
  if (!role) return false
  const roleData = ROLE_PERMISSIONS[role as UserRole]
  if (!roleData) return false
  return roleData[permission]
}

/**
 * Checks if a user object (from Supabase auth) is a CMS admin.
 * @param user The auth user object.
 * @returns boolean
 */
export function is_admin(user: User): boolean {
  const role = user?.user_metadata?.role || user?.app_metadata?.role
  return role === "admin"
}
