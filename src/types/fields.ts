/**
 * Supported CMS field types.
 */
export interface CMSFieldOption {
  label: string
  value: string
}

export type CMSFieldType =
  | "text_single" // text (Single-line Input)
  | "text_multi" // text (Markdown / Rich-text Block)
  | "select" // text (Predefined dropdown)
  | "number" // numeric (Integers or Floats)
  | "boolean" // boolean (Switches / Toggles)
  | "date_time" // timestamptz (Date pickers)
  | "color" // text (Hex or RGBA pickers)
  | "seo_slug" // text (Unique constraint, automatic frontend sluggification)
  | "media" // jsonb (Array of references to uploaded assets)
  | "json" // jsonb (Raw Metadata block or custom data payload)
  | "tags" // jsonb (Collection of strings/keywords)
  | "rich_text" // text (WYSIWYG HTML content, ProseMirror)
  | "structured_text" // jsonb (ProseMirror rich text with blocks)
  | "modular_content" // jsonb (Dynamic block layouts)
  | "seo_metadata" // jsonb (Grouped SEO metadata)
  | "reference" // jsonb (Link to other records)
  | "navigation" // jsonb (Site navigation tree)
  | "standings_table" // jsonb (Rugby standings table)

/**
 * Represents a field configuration in the registry.
 */
export interface CMSFieldSettings {
  // General / Appearance
  placeholder?: string
  help_text?: string

  // RBAC
  required_role?: "admin" | "editor" | "author"
  hide_from_roles?: ("admin" | "editor" | "author")[]

  // Number settings
  min?: number
  max?: number
  step?: number

  // Text settings
  min_length?: number
  max_length?: number
  regex_pattern?: string
  regex_flags?: string

  // Select / Dropdown
  choices?: CMSFieldOption[]

  // Date/Time
  include_time?: boolean

  // Media / Reference
  allow_multiple?: boolean
  allowed_models?: string[]
  min_items?: number
  max_items?: number

  // Rich Text
  enabled_tools?: string[]

  // Slug
  source_field?: string

  // Modular Content / Structured Text
  allowed_blocks?: string[]
  min_blocks?: number
  max_blocks?: number

  // Fallback for custom settings
  [key: string]: unknown
}

/**
 * Represents a field configuration in the registry.
 */
export interface CMSField {
  id: string
  model_id: string | null
  block_id?: string | null
  fieldset_id?: string | null
  slug: string
  field_label: string
  field_description?: string
  field_type: CMSFieldType
  is_required: boolean
  is_unique: boolean
  is_system: boolean
  is_computed: boolean
  ui_order: number
  settings: CMSFieldSettings
  field_note?: string | null
  created_at: string
  updated_at: string
}

/**
 * Represents a field grouping in the registry.
 */
export interface CMSFieldset {
  id: string
  model_id: string
  label: string
  ui_order: number
  settings?: {
    default_open?: boolean
  }
  created_at: string
  updated_at: string
}

/**
 * Metadata for defining field behavior and mapping.
 */
export interface CMSFieldDefinition {
  type: CMSFieldType
  label: string
  dbType: "text" | "numeric" | "boolean" | "timestamptz" | "jsonb"
  description: string
  icon: string
  category: "basic" | "content" | "relational" | "advanced"
}

/**
 * Represents a block group (folder).
 */
export interface CMSBlockGroup {
  id: string
  name: string
  emoji?: string | null
  display_order: number
  created_at: string
}

/**
 * Represents a reusable block of fields.
 */
export interface CMSBlock {
  id: string
  label: string
  api_id: string
  emoji?: string | null
  description?: string | null
  display_order?: number
  group_id?: string | null
  created_at: string
  updated_at: string
  // Virtual field for UI
  fields?: CMSField[]
}
