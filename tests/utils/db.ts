import { createAdminClient } from "@/utils/supabase-admin"

const adminClient = createAdminClient()

/**
 * Interface for model metadata used in tests.
 */
export interface TestModelData {
  table_name: string
  friendly_name: string
  slug?: string
  is_singleton?: boolean
  has_draft_mode?: boolean
  emoji?: string
  group_id?: string | null
  display_order?: number
  list_columns?: string[]
  preview_columns?: string[]
  subtitle_column?: string | null
  default_sort_column?: string | null
  default_sort_direction?: "asc" | "desc" | null
}

/**
 * Interface for field metadata used in tests.
 */
export interface TestFieldData {
  slug: string
  field_label: string
  field_type: string
  is_required?: boolean
  is_unique?: boolean
  is_system?: boolean
  is_computed?: boolean
  ui_order?: number
  settings?: Record<string, unknown>
  fieldset_id?: string | null
  block_id?: string | null
  field_note?: string | null
}

// Track tables created during a test run for easy cleanup
const createdTables: string[] = []

/**
 * Creates a physical table and registers it in the CMS models registry.
 * @param data - The model metadata.
 */
export async function createTestModel(data: TestModelData) {
  const { table_name } = data

  // 1. Create physical table
  const { error: tableError } = await adminClient.rpc(
    "create_table_with_uuid_and_timestamp",
    { table_name }
  )

  if (tableError) {
    throw new Error(
      `Failed to create physical table ${table_name}: ${tableError.message}`
    )
  }

  // 2. Register in models table
  const { error: registryError } = await adminClient.from("models").upsert([
    {
      table_name: table_name,
      slug: data.slug || table_name,
      friendly_name: data.friendly_name,
      is_singleton: data.is_singleton || false,
      has_draft_mode: data.has_draft_mode || false,
      emoji: data.emoji || null,
      group_id: data.group_id || null,
      display_order: data.display_order || 0,
      list_columns: data.list_columns || [],
      preview_columns: data.preview_columns || [],
      subtitle_column: data.subtitle_column || null,
      default_sort_column: data.default_sort_column || null,
      default_sort_direction: data.default_sort_direction || null,
    },
  ])

  if (registryError) {
    throw new Error(
      `Failed to register model ${table_name}: ${registryError.message}`
    )
  }

  // 3. Handle draft mode columns if needed
  if (data.has_draft_mode) {
    const sql = `
      ALTER TABLE public."${table_name}" 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      ADD COLUMN IF NOT EXISTS _draft JSONB;
    `
    const { error: sqlError } = await adminClient.rpc("exec_sql", { sql })
    if (sqlError) {
      throw new Error(
        `Failed to add draft columns to ${table_name}: ${sqlError.message}`
      )
    }
  }

  createdTables.push(table_name)
}

/**
 * Adds a field to the CMS registry and creates the physical column.
 * @param tableName - The table to add the field to.
 * @param field - The field metadata.
 */
export async function addTestField(tableName: string, field: TestFieldData) {
  // 1. Get model ID
  const { data: model, error: modelError } = await adminClient
    .from("models")
    .select("id")
    .eq("table_name", tableName)
    .single()

  if (modelError || !model) {
    throw new Error(`Could not find model for table ${tableName}`)
  }

  // 2. Add to fields registry and create physical column using internal RPC
  const pgType = mapFieldTypeToPostgres(field.field_type)

  const { error: fieldError } = await adminClient.rpc("create_model_field", {
    p_model_id: model.id,
    p_slug: field.slug,
    p_field_label: field.field_label,
    p_field_type: field.field_type,
    p_db_type: pgType,
    p_is_required: field.is_required || false,
    p_is_unique: field.is_unique || false,
    p_ui_order: field.ui_order || 0,
    p_settings: field.settings || {},
    p_block_id: field.block_id || null,
    p_fieldset_id: field.fieldset_id || null,
    p_field_note: field.field_note || null,
  })

  if (fieldError) {
    throw new Error(
      `Failed to create field ${field.slug} for ${tableName}: ${fieldError.message}`
    )
  }

  // Note: is_system and is_computed are not handled by create_model_field,
  // so we update them separately if needed.
  if (field.is_system !== undefined || field.is_computed !== undefined) {
    await adminClient
      .from("fields")
      .update({
        is_system: field.is_system,
        is_computed: field.is_computed,
      })
      .eq("model_id", model.id)
      .eq("slug", field.slug)
  }
}

/**
 * Updates a field's metadata in the CMS registry.
 * @param tableName - The table the field belongs to.
 * @param fieldSlug - The slug of the field to update.
 * @param updates - The partial field metadata updates.
 */
export async function updateTestField(
  tableName: string,
  fieldSlug: string,
  updates: Partial<TestFieldData>
) {
  // 1. Get model ID
  const { data: model, error: modelError } = await adminClient
    .from("models")
    .select("id")
    .eq("table_name", tableName)
    .single()

  if (modelError || !model) {
    throw new Error(`Could not find model for table ${tableName}`)
  }

  // 2. Update field registry
  const { error: fieldUpdateError } = await adminClient
    .from("fields")
    .update({
      field_label: updates.field_label,
      field_type: updates.field_type,
      is_required: updates.is_required,
      is_unique: updates.is_unique,
      is_system: updates.is_system,
      is_computed: updates.is_computed,
      ui_order: updates.ui_order,
      settings: updates.settings,
      fieldset_id: updates.fieldset_id,
      block_id: updates.block_id,
    })
    .eq("model_id", model.id)
    .eq("slug", fieldSlug)

  if (fieldUpdateError) {
    throw new Error(
      `Failed to update field ${fieldSlug} for ${tableName}: ${fieldUpdateError.message}`
    )
  }
}

/**
 * Removes a field from the registry and drops its physical column.
 * @param tableName - The table the field belongs to.
 * @param fieldSlug - The slug of the field to remove.
 */
export async function removeTestField(tableName: string, fieldSlug: string) {
  // 1. Find the model and then the field ID
  // Using a more reliable 2-step approach.
  const { data: model } = await adminClient
    .from("models")
    .select("id")
    .eq("table_name", tableName)
    .single()

  if (!model) throw new Error(`Model ${tableName} not found`)

  const { data: fieldRecord } = await adminClient
    .from("fields")
    .select("id")
    .eq("model_id", model.id)
    .eq("slug", fieldSlug)
    .single()

  if (!fieldRecord)
    throw new Error(`Field ${fieldSlug} not found in ${tableName}`)

  const { error: dropError } = await adminClient.rpc("drop_model_field", {
    p_field_id: fieldRecord.id,
  })

  if (dropError) {
    throw new Error(
      `Failed to drop field ${fieldSlug} from ${tableName}: ${dropError.message}`
    )
  }
}

/**
 * Updates a model's metadata in the CMS registry.
 * @param tableName - The physical table name of the model to update.
 * @param updates - The partial model metadata updates.
 */
export async function updateTestModel(
  tableName: string,
  updates: Partial<TestModelData>
) {
  const { error: registryUpdateError } = await adminClient
    .from("models")
    .update({
      slug: updates.slug,
      friendly_name: updates.friendly_name,
      is_singleton: updates.is_singleton,
      has_draft_mode: updates.has_draft_mode,
      emoji: updates.emoji,
      group_id: updates.group_id,
      display_order: updates.display_order,
      list_columns: updates.list_columns,
      preview_columns: updates.preview_columns,
      subtitle_column: updates.subtitle_column,
      default_sort_column: updates.default_sort_column,
      default_sort_direction: updates.default_sort_direction,
    })
    .eq("table_name", tableName)

  if (registryUpdateError) {
    throw new Error(
      `Failed to update model ${tableName}: ${registryUpdateError.message}`
    )
  }
}

/**
 * Deletes a model from the registry and drops its physical table.
 * @param tableName - The table to delete.
 */
export async function deleteTestModel(tableName: string) {
  // 1. Remove from registry (cascades to fields)
  const { error: registryError } = await adminClient
    .from("models")
    .delete()
    .eq("table_name", tableName)

  if (registryError) {
    throw new Error(
      `Failed to remove ${tableName} from registry: ${registryError.message}`
    )
  }

  // 2. Drop physical table
  const { error: tableError } = await adminClient.rpc("drop_table", {
    table_name: tableName,
  })

  if (tableError) {
    throw new Error(`Failed to drop table ${tableName}: ${tableError.message}`)
  }

  const index = createdTables.indexOf(tableName)
  if (index > -1) {
    createdTables.splice(index, 1)
  }
}

/**
 * Cleans up all tables created during the current test session.
 */
export async function cleanup() {
  const tables = [...createdTables]
  for (const table of tables) {
    try {
      await deleteTestModel(table)
    } catch (err) {
      console.error(`Failed to cleanup table ${table}:`, err)
    }
  }
}

/**
 * Maps CMS field types to Postgres types (internal helper).
 */
function mapFieldTypeToPostgres(fieldType: string): string {
  switch (fieldType) {
    case "text_single":
    case "text_multi":
      return "TEXT"
    case "number":
      return "NUMERIC"
    case "boolean":
      return "BOOLEAN"
    case "date":
      return "DATE"
    case "datetime":
      return "TIMESTAMPTZ"
    case "json":
    case "structured_text":
      return "JSONB"
    case "reference":
      return "UUID"
    case "asset":
      return "JSONB"
    default:
      return "TEXT"
  }
}
