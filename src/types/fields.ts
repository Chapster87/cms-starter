/**
 * Supported CMS field types.
 */
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

/**
 * Represents a field configuration in the registry.
 */
export interface CMSField {
  id: string
  model_id: string
  field_name: string
  field_label: string
  field_type: CMSFieldType
  is_required: boolean
  is_unique: boolean
  is_system: boolean
  ui_order: number
  settings: Record<string, unknown>
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
}
