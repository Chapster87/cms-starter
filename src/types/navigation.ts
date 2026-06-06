/**
 * Supported navigation item types.
 */
export type NavigationItemType = "internal" | "external" | "static" | "group"

/**
 * Represents a single item in the navigation tree.
 */
export interface NavigationItem {
  id: string
  type: NavigationItemType
  labelOverride?: string

  // Internal link fields
  linkedRecord?: {
    id: string
    modelId: string
    displayName?: string // Cached display name for preview
    slug?: string // Cached slug for preview
  }

  // External link fields
  url?: string
  openInNewTab?: boolean
  noFollow?: boolean

  // Static route fields
  routePath?: string

  // Recursive children
  children?: NavigationItem[]
}

/**
 * The data structure stored in the database for the navigation field.
 */
export type NavigationData = NavigationItem[]
