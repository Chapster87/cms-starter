import { CMSFieldDefinition } from "@/types/fields"

/**
 * Centralized mapping of CMS field types to database types and UI labels.
 */
export const FIELD_DEFINITIONS: CMSFieldDefinition[] = [
  {
    type: "text_single",
    label: "Single-line Text",
    dbType: "text",
    description: "Ideal for titles, names, or short strings.",
    icon: "type",
  },
  {
    type: "text_multi",
    label: "Multi-line Text",
    dbType: "text",
    description: "For longer content like descriptions or markdown.",
    icon: "align-left",
  },
  {
    type: "select",
    label: "Dropdown / Select",
    dbType: "text",
    description: "Predefined list of options.",
    icon: "list",
  },
  {
    type: "number",
    label: "Number",
    dbType: "numeric",
    description: "Integers or decimals.",
    icon: "hash",
  },
  {
    type: "boolean",
    label: "Boolean",
    dbType: "boolean",
    description: "Simple true/false toggle.",
    icon: "check-square",
  },
  {
    type: "date_time",
    label: "Date & Time",
    dbType: "timestamptz",
    description: "Date picker with time support.",
    icon: "calendar",
  },
  {
    type: "color",
    label: "Color",
    dbType: "text",
    description: "Hex or RGBA color strings.",
    icon: "droplet",
  },
  {
    type: "seo_slug",
    label: "SEO Slug",
    dbType: "text",
    description: "URL-friendly string with unique constraint.",
    icon: "link",
  },
  {
    type: "media",
    label: "Media Assets",
    dbType: "jsonb",
    description: "References to uploaded images or files.",
    icon: "image",
  },
  {
    type: "rich_text",
    label: "Rich Text",
    dbType: "text",
    description: "Visual editor for formatted content.",
    icon: "edit-3",
  },
  {
    type: "json",
    label: "JSON",
    dbType: "jsonb",
    description: "Structured data payload for advanced use cases.",
    icon: "code",
  },
  {
    type: "tags",
    label: "Tags / List",
    dbType: "jsonb",
    description: "Collection of strings or keywords.",
    icon: "tag",
  },
  {
    type: "modular_content",
    label: "Modular Content",
    dbType: "jsonb",
    description: "Dynamic blocks and component layouts.",
    icon: "layers",
  },
  {
    type: "seo_metadata",
    label: "SEO Metadata",
    dbType: "jsonb",
    description: "Grouped SEO fields (Title, OG, Keywords, etc.)",
    icon: "search",
  },
  {
    type: "reference",
    label: "Linked Record",
    dbType: "jsonb",
    description: "Reference to other records in the CMS.",
    icon: "external-link",
  },
  {
    type: "navigation",
    label: "Site Navigation",
    dbType: "jsonb",
    description: "Hierarchical menu with internal/external links.",
    icon: "menu",
  },
]

/**
 * Helper to get a field definition by its CMS type.
 * @param {string} type - The CMS field type.
 * @returns {CMSFieldDefinition | undefined} The field definition.
 */
export function getFieldDefinition(
  type: string
): CMSFieldDefinition | undefined {
  return FIELD_DEFINITIONS.find((f) => f.type === type)
}
