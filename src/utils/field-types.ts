import { CMSFieldDefinition } from "@/types/fields"

/**
 * Centralized mapping of CMS field types to database types and UI labels.
 */
export const FIELD_DEFINITIONS: CMSFieldDefinition[] = [
  // Basic
  {
    type: "text_single",
    label: "Single-line Text",
    dbType: "text",
    description: "Ideal for titles, names, or short strings.",
    icon: "type",
    category: "basic",
  },
  {
    type: "number",
    label: "Number",
    dbType: "numeric",
    description: "Integers or decimals.",
    icon: "hash",
    category: "basic",
  },
  {
    type: "boolean",
    label: "Boolean",
    dbType: "boolean",
    description: "Simple true/false toggle.",
    icon: "check-square",
    category: "basic",
  },
  {
    type: "date_time",
    label: "Date & Time",
    dbType: "timestamptz",
    description: "Date picker with time support.",
    icon: "calendar",
    category: "basic",
  },
  {
    type: "select",
    label: "Dropdown / Select",
    dbType: "text",
    description: "Predefined list of options.",
    icon: "list",
    category: "basic",
  },
  {
    type: "color",
    label: "Color",
    dbType: "text",
    description: "Hex or RGBA color strings.",
    icon: "droplet",
    category: "basic",
  },
  {
    type: "seo_slug",
    label: "SEO Slug",
    dbType: "text",
    description: "URL-friendly string with unique constraint.",
    icon: "link",
    category: "basic",
  },

  // Content
  {
    type: "rich_text",
    label: "Rich Text",
    dbType: "text",
    description: "Visual editor for formatted content.",
    icon: "edit-3",
    category: "content",
  },
  {
    type: "structured_text",
    label: "Structured Text",
    dbType: "jsonb",
    description: "Rich text with embedded blocks.",
    icon: "layout",
    category: "content",
  },
  {
    type: "text_multi",
    label: "Multi-line Text",
    dbType: "text",
    description: "For longer content like descriptions or markdown.",
    icon: "align-left",
    category: "content",
  },
  {
    type: "media",
    label: "Media Assets",
    dbType: "jsonb",
    description: "References to uploaded images or files.",
    icon: "image",
    category: "content",
  },
  {
    type: "modular_content",
    label: "Modular Content",
    dbType: "jsonb",
    description: "Dynamic blocks and component layouts.",
    icon: "layers",
    category: "content",
  },
  {
    type: "tags",
    label: "Tags / List",
    dbType: "jsonb",
    description: "Collection of strings or keywords.",
    icon: "tag",
    category: "content",
  },

  // Relational
  {
    type: "reference",
    label: "Linked Record",
    dbType: "jsonb",
    description: "Reference to other records in the CMS.",
    icon: "external-link",
    category: "relational",
  },
  {
    type: "navigation",
    label: "Site Navigation",
    dbType: "jsonb",
    description: "Hierarchical menu with internal/external links.",
    icon: "menu",
    category: "relational",
  },

  // Advanced
  {
    type: "standings_table",
    label: "Rugby Standings",
    dbType: "jsonb",
    description: "Rugby League standings table with team stats.",
    icon: "award",
    category: "advanced",
  },
  {
    type: "seo_metadata",
    label: "SEO Metadata",
    dbType: "jsonb",
    description: "Grouped SEO fields (Title, OG, Keywords, etc.)",
    icon: "search",
    category: "advanced",
  },
  {
    type: "json",
    label: "JSON",
    dbType: "jsonb",
    description: "Structured data payload for advanced use cases.",
    icon: "code",
    category: "advanced",
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
