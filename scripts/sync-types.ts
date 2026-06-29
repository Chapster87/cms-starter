import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"

// Load env vars from .env.local
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

interface CMSModel {
  id: string
  model_id: string
  friendly_name: string
  table_name: string
  has_draft_mode?: boolean
}

interface CMSField {
  id: string
  model_id: string | null
  block_id: string | null
  slug: string
  field_type: string
  is_required: boolean
  settings?: Record<string, unknown>
}

interface CMSBlock {
  id: string
  label: string
  api_id: string
}

const toPascalCase = (str: string) => {
  return str
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
    .replace(/^[0-9]/, "M_")
}

const mapFieldTypeToTs = (field: CMSField, models: CMSModel[]) => {
  const isMultiple = field.settings?.allow_multiple === true

  let baseType = "string"

  switch (field.field_type) {
    case "number":
      baseType = "number"
      break
    case "boolean":
      baseType = "boolean"
      break
    case "media":
      baseType = "MediaAsset" // Reference to our global MediaAsset type
      break
    case "tags":
      baseType = "string[]"
      break
    case "modular_content":
      baseType = "ModularContentData"
      break
    case "navigation":
      baseType = "NavigationData"
      break
    case "standings_table":
      baseType = "StandingsData"
      break
    case "seo_metadata":
      baseType = "SeoMetadata"
      break
    case "json":
      baseType = "unknown"
      break
    case "reference":
      const allowedIds = (field.settings?.allowed_models as string[]) || []
      const linkedModel = models.find((m) => allowedIds.includes(m.id))
      if (linkedModel) {
        baseType = toPascalCase(
          linkedModel.friendly_name || linkedModel.table_name
        )
      } else {
        baseType = "unknown"
      }
      break
    default:
      baseType = "string"
  }

  if (isMultiple && field.field_type !== "tags") {
    return `${baseType}[]`
  }

  return baseType
}

async function syncTypes() {
  console.log("--- CMS Type Sync ---")
  console.log("Fetching metadata from Supabase...")

  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("*")
  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("*")
  const { data: fields, error: fieldsError } = await supabase
    .from("fields")
    .select("*")

  if (modelsError || blocksError || fieldsError) {
    console.error(
      "Error fetching metadata:",
      modelsError || blocksError || fieldsError
    )
    return
  }

  const validModels = (models as CMSModel[]).filter(
    (m) => (m.friendly_name || m.model_id) && m.table_name
  )
  const validBlocks = (blocks as CMSBlock[]).filter((b) => b.label && b.api_id)
  const allFields = (fields as Record<string, unknown>[]).map((f) => ({
    ...f,
    settings:
      typeof f.settings === "string" ? JSON.parse(f.settings) : f.settings,
  })) as CMSField[]

  let content = `/**
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT DIRECTLY.
 * Run 'pnpm sync-types' to update.
 */

export type StorageProvider = "cloudinary" | "supabase" | "local";

export interface MediaAsset {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  file_name?: string;
  url: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  folder: string;
  tags: string[];
  storage_provider: StorageProvider;
  provider_metadata: Record<string, unknown>;
  created_by?: string;
}

export type CMSStatus = "published" | "draft" | "changed";

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  noIndex?: boolean;
  ogImage?: MediaAsset;
  ogTitle?: string;
  ogDescription?: string;
}

export type NavigationItemType = "internal" | "external" | "static" | "group";

export interface NavigationItem {
  id: string;
  type: NavigationItemType;
  labelOverride?: string;
  linkedRecord?: {
    id: string;
    modelId: string;
    displayName?: string;
    slug?: string;
  };
  url?: string;
  openInNewTab?: boolean;
  noFollow?: boolean;
  routePath?: string;
  children?: NavigationItem[];
}

export type NavigationData = NavigationItem[];

export interface ModularContentBlock {
  id: string;
  type: string;
  data: unknown;
}

export type ModularContentData = ModularContentBlock[];

export interface StandingsRow {
  team_id: string;
  team_logo?: MediaAsset;
  team_name?: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  points_for?: number;
  points_against?: number;
  points_diff?: number;
  bonus_points?: number;
  points?: number;
  [key: string]: unknown;
}

export type StandingsData = StandingsRow[];

`

  for (const model of validModels) {
    const typeName = toPascalCase(model.friendly_name || model.table_name)
    const modelFields = allFields.filter((f) => f.model_id === model.id)

    content += `export interface ${typeName} {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
`

    const baseFields = ["id", "created_at", "updated_at", "status", "_draft"]

    for (const field of modelFields) {
      if (baseFields.includes(field.slug)) continue
      const tsType = mapFieldTypeToTs(field, validModels)
      const optional = field.is_required ? "" : "?"
      content += `  ${field.slug}${optional}: ${tsType};\n`
    }

    content += `}\n\n`
  }

  // 6. Add Model Map and Union Type
  const modelNames = validModels.map((m) => m.table_name)
  const interfaceNames = validModels.map((m) =>
    toPascalCase(m.friendly_name || m.table_name)
  )

  content += `export interface CMSModelMap {\n`
  modelNames.forEach((name, i) => {
    content += `  ${name}: ${interfaceNames[i]};\n`
  })
  content += `}\n\n`

  content += `export type CMSModelName = keyof CMSModelMap;\n`
  content += `export type AnyCMSModel = CMSModelMap[CMSModelName];\n\n`

  // 7. Add Block Interfaces
  content += `/**\n * BLOCK TYPES\n */\n\n`
  for (const block of validBlocks) {
    const typeName = toPascalCase(block.label)
    const blockFields = allFields.filter((f) => f.block_id === block.id)

    content += `export interface ${typeName} {\n`
    content += `  id: string;\n`
    content += `  created_at: string;\n`
    content += `  updated_at: string;\n`

    const baseFields = ["id", "created_at", "updated_at"]

    for (const field of blockFields) {
      if (baseFields.includes(field.slug)) continue
      const tsType = mapFieldTypeToTs(field, validModels)
      const optional = field.is_required ? "" : "?"
      content += `  ${field.slug}${optional}: ${tsType};\n`
    }

    content += `}\n\n`
  }

  // 8. Add Block Map
  content += `export interface CMSBlockMap {\n`
  validBlocks.forEach((block) => {
    content += `  ${block.api_id}: ${toPascalCase(block.label)};\n`
  })
  content += `}\n\n`

  content += `export type CMSBlockName = keyof CMSBlockMap;\n`

  const outputPath = path.join(process.cwd(), "src/types/cms-generated.ts")
  fs.writeFileSync(outputPath, content)

  console.log(`Successfully generated types to: ${outputPath}`)
  console.log("----------------------")
}

syncTypes().catch(console.error)
