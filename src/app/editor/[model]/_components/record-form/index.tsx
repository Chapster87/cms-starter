"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { RefreshCw, ChevronDown } from "lucide-react"
import * as Accordion from "@radix-ui/react-accordion"
import Button from "@/components/button"
import { useAuth } from "@/hooks/use-auth"
import { useUsers } from "@/hooks/use-users"
import { createClient } from "@/utils/supabase"
import { CMSField, CMSFieldset } from "@/types/fields"
import { toast } from "@/client/toast-store"
import { CMSModelMap, CMSModelName } from "@/types/cms-generated"
import { FieldRegistry } from "./field-registry"
import s from "./style.module.css"

interface FieldSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface RecordFormProps<T extends CMSModelName> {
  id?: string
  model: T
  initialData?: Partial<CMSModelMap[T]>
  onSubmit: (data: Partial<CMSModelMap[T]>) => Promise<void>
  onAutoSave?: (data: Partial<CMSModelMap[T]>) => void
  isLoading: boolean
  hasDraftMode?: boolean
}

/**
 * A dynamic form component that generates inputs based on a table's schema.
 */
export default function RecordForm<T extends CMSModelName>({
  id,
  model,
  initialData,
  onSubmit,
  onAutoSave,
  isLoading,
  hasDraftMode: _,
}: RecordFormProps<T>) {
  const { accessToken } = useAuth()
  const { users } = useUsers()
  const [schema, setSchema] = useState<CMSField[]>([])
  const [fieldsets, setFieldsets] = useState<CMSFieldset[]>([])

  // Use a more flexible internal type for the form data while keeping the component generic
  const [formData, setFormData] = useState<Record<string, unknown>>(
    (initialData as Record<string, unknown>) || {}
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fetchingSchema, setFetchingSchema] = useState(true)

  /**
   * Internal helper for accessing form data dynamically.
   */
  const getFieldValue = useCallback(
    (key: string): unknown => {
      return formData[key]
    },
    [formData]
  )

  /**
   * Validates a single field and updates the error state.
   */
  const validateField = useCallback(
    (name: string, value: unknown, isRequired?: boolean) => {
      if (
        isRequired &&
        (value === undefined || value === null || value === "")
      ) {
        setErrors((prev) => ({ ...prev, [name]: "This field is required" }))
        return false
      }
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
      return true
    },
    []
  )

  // Sync internal form data with initialData ONLY on initial load or if the record ID changes.
  // We avoid syncing on every initialData change to prevent "flashing" or reloads during auto-save.
  useEffect(() => {
    if (initialData) {
      // Proactively "unwrap" stringified JSON for media/json fields on load
      const unwrappedData = { ...initialData } as Record<string, unknown>

      // Proactively unwrap JSON strings for complex field types (media, json, modular_content, structured_text)
      Object.keys(unwrappedData).forEach((key) => {
        const val = (unwrappedData as Record<string, unknown>)[key]
        if (
          typeof val === "string" &&
          (val.trim().startsWith("{") || val.trim().startsWith("["))
        ) {
          try {
            unwrappedData[key] = JSON.parse(val)
          } catch (_e) {
            /* ignore */
          }
        }
      })

      // Defer state update to avoid cascading renders and "flashing"
      const timer = setTimeout(() => {
        setFormData(unwrappedData)
      }, 0)
      return () => clearTimeout(timer)
    }
    // We intentionally only run this when the record ID changes.
    // Subsequent updates to the same record should be managed by internal state (setFormData).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    let isMounted = true
    const fetchSchema = async () => {
      if (!isMounted) return
      setFetchingSchema(true)
      try {
        const headers: Record<string, string> = {}
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        // 1. Fetch CMS-defined fields from the registry using the table name
        const response = await fetch(
          `/api/models/schema/fields?table=${model}`,
          { headers }
        )
        if (!response.ok) throw new Error("Failed to fetch fields")
        const data = await response.json()

        if (data && data.length > 0) {
          if (!isMounted) return
          // Ensure system fields are suppressed even if registered
          // Note: we filter out 'status' and '_draft' from the UI because they are managed via the workflow,
          // but they are kept in the registry for data persistence and audit logging.
          const filteredData = data.filter(
            (f: CMSField) =>
              !["_draft", "status", "created_by", "updated_by"].includes(f.slug)
          )
          setSchema(filteredData)

          // 1.1 Fetch Fieldsets for this model
          // We need the model ID first
          const supabase = createClient()
          const { data: modelData } = await supabase
            .from("models")
            .select("id")
            .eq("table_name", model)
            .single()

          if (modelData) {
            const fsResponse = await fetch(
              `/api/models/schema/fieldsets?model_id=${modelData.id}`,
              { headers }
            )
            if (fsResponse.ok) {
              const fsData = await fsResponse.json()
              setFieldsets(fsData || [])
            }
          }
        } else {
          // Fallback: If no registry entry found, try to fetch raw schema
          const response = await fetch(`/api/models/schema?table=${model}`, {
            headers,
          })
          if (!response.ok) throw new Error("Failed to fetch schema")
          const data = await response.json()

          // Map raw schema to partial CMSField objects for compatibility
          const mappedFields = data
            .filter(
              (f: FieldSchema) =>
                ![
                  "id",
                  "created_at",
                  "updated_at",
                  "status",
                  "_draft",
                ].includes(f.column_name)
            )
            .map((f: FieldSchema) => ({
              id: f.column_name,
              slug: f.column_name,
              field_label: f.column_name.replace(/_/g, " "),
              field_type:
                f.data_type === "boolean"
                  ? "boolean"
                  : f.data_type === "integer" || f.data_type === "numeric"
                    ? "number"
                    : "text_single",
              is_required: f.is_nullable === "NO",
            }))

          if (!isMounted) return
          setSchema(mappedFields)
        }
      } catch (err) {
        if (!isMounted) return
        console.error("Error fetching schema:", err)
      } finally {
        if (!isMounted) return
        setFetchingSchema(false)
      }
    }
    fetchSchema()
    return () => {
      isMounted = false
    }
  }, [model, accessToken])

  const handleChange = useCallback(
    (columnName: string, value: unknown) => {
      setFormData((prev) => {
        const nextData = {
          ...prev,
          [columnName]: value,
        }

        const field = schema.find((f) => f.slug === columnName)
        validateField(columnName, value, field?.is_required)

        // Auto-sync from user if linking for the first time
        if (
          (model as string) === "authors" &&
          columnName === "user_id" &&
          value
        ) {
          const userId = Array.isArray(value) ? value[0] : value
          const linkedUser = users.find((u) => u.id === userId)

          if (linkedUser) {
            const updates: Record<string, unknown> = {}
            // Auto populate if the fields are currently empty
            if (linkedUser.display_name && !nextData["name"]) {
              updates["name"] = linkedUser.display_name
            }
            if (linkedUser.avatar_url && !nextData["avatar_url"]) {
              updates["avatar_url"] = linkedUser.avatar_url
            }

            if (Object.keys(updates).length > 0) {
              Object.assign(nextData, updates)
              toast.info(
                `Auto-populated from ${linkedUser.display_name || "user"}`
              )
            }
          }
        }

        if (onAutoSave) {
          onAutoSave(nextData as Partial<CMSModelMap[T]>)
        }

        return nextData
      })
    },
    [model, onAutoSave, schema, users, validateField]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      // Perform full validation
      const nextErrors: Record<string, string> = {}
      let hasErrors = false

      schema.forEach((field) => {
        const val = formData[field.slug]
        if (
          field.is_required &&
          (val === undefined || val === null || val === "")
        ) {
          nextErrors[field.slug] = "This field is required"
          hasErrors = true
        }
      })

      if (hasErrors) {
        setErrors(nextErrors)
        toast.error(
          "Validation Error",
          "Please fix the errors in the form before submitting."
        )
        return
      }

      // Clean data before submission
      const cleanData = { ...formData }

      // Strip virtual fields added by the reference resolver
      delete cleanData._resolved

      schema.forEach((field) => {
        // Remove computed fields from payload
        if (field.is_computed) {
          delete cleanData[field.slug]
          return
        }

        const val = cleanData[field.slug]

        // Force relationship fields on 'teams' model to stay as arrays for jsonb compatibility
        if (
          (model as string) === "teams" &&
          (field.slug === "league" || field.slug === "division")
        ) {
          if (val && !Array.isArray(val)) {
            cleanData[field.slug] = [val]
          }
        }

        // 1. Unwrap stringified complex fields (media, json, modular_content, structured_text)
        if (
          (field.field_type === "media" ||
            field.field_type === "json" ||
            field.field_type === "modular_content" ||
            field.field_type === "structured_text") &&
          typeof val === "string" &&
          (val.startsWith("{") || val.startsWith("["))
        ) {
          try {
            cleanData[field.slug] = JSON.parse(val)
          } catch (_e) {
            // Not valid JSON, leave as is
          }
        }

        // 2. Unwrap single-reference fields (Postgres expects UUID, not UUID[])
        // EXCEPT for teams model where league/division must remain arrays
        if (field.field_type === "reference") {
          const settings = (field.settings || {}) as Record<string, unknown>
          const isMultiple =
            settings.multiple === true || settings.allow_multiple === true

          const isTeamsSpecialField =
            (model as string) === "teams" &&
            (field.slug === "league" || field.slug === "division")

          if (
            !isMultiple &&
            !isTeamsSpecialField &&
            Array.isArray(val) &&
            val.length > 0
          ) {
            cleanData[field.slug] = val[0]
          }
        }
      })

      onSubmit(cleanData as Partial<CMSModelMap[T]>)
    },
    [formData, model, onSubmit, schema]
  )

  const handleSyncFromUser = useCallback(() => {
    const userId = formData["user_id"]
    if (!userId) {
      toast.error("No user selected to sync from")
      return
    }

    const linkedUser = users.find(
      (u) =>
        u.id === userId ||
        (Array.isArray(userId) && userId.includes(u.id)) ||
        (typeof userId === "string" && userId.includes(u.id))
    )

    if (!linkedUser) {
      toast.error("Linked user not found")
      return
    }

    const updates: Record<string, unknown> = {}
    let updateCount = 0

    if (
      linkedUser.display_name &&
      formData["name"] !== linkedUser.display_name
    ) {
      updates["name"] = linkedUser.display_name
      updateCount++
    }

    if (
      linkedUser.avatar_url &&
      formData["avatar_url"] !== linkedUser.avatar_url
    ) {
      updates["avatar_url"] = linkedUser.avatar_url
      updateCount++
    }

    if (updateCount > 0) {
      const nextData = { ...formData, ...updates }
      setFormData(nextData)
      if (onAutoSave) onAutoSave(nextData as Partial<CMSModelMap[T]>)
      toast.success("Synced from User Profile", `Updated ${updateCount} fields`)
    } else {
      toast.info(
        "Already in sync",
        "Author details match the linked user profile."
      )
    }
  }, [formData, onAutoSave, users])

  /**
   * Delegates rendering to specialized sub-components via the registry.
   */
  const renderField = useCallback(
    (field: CMSField) => {
      return (
        <FieldRegistry
          key={field.slug}
          field={field}
          value={getFieldValue(field.slug)}
          error={errors[field.slug]}
          disabled={isLoading || !!field.is_computed}
          onChange={(val: unknown) => handleChange(field.slug, val)}
          getFieldValue={getFieldValue}
          schema={schema}
        />
      )
    },
    [errors, handleChange, getFieldValue, isLoading, schema]
  )

  // Determine open fieldsets
  const defaultOpenValues = useMemo(
    () =>
      fieldsets
        .filter((fs) => fs.settings?.default_open !== false)
        .map((fs) => fs.id),
    [fieldsets]
  )

  // Unified interleaved items for the form
  const interleavedItems = useMemo(() => {
    const items: Array<
      | { type: "fieldset"; data: CMSFieldset }
      | { type: "field"; data: CMSField }
    > = [
      ...fieldsets.map((fs) => ({
        type: "fieldset" as const,
        data: fs,
      })),
      ...schema
        .filter((f) => !f.fieldset_id)
        .map((f) => ({ type: "field" as const, data: f })),
    ]

    return items.sort((a, b) => {
      if (a.data.ui_order !== b.data.ui_order) {
        return a.data.ui_order - b.data.ui_order
      }
      return a.type === "fieldset" ? -1 : 1
    })
  }, [schema, fieldsets])

  if (fetchingSchema) return <p>Loading form fields...</p>

  return (
    <form id={id} onSubmit={handleSubmit} className={s.form}>
      {(model as string) === "authors" && !!getFieldValue("user_id") && (
        <div style={{ marginBottom: "8px" }}>
          <Button
            type="button"
            variant="secondary"
            size="small"
            beforeText={<RefreshCw size={14} />}
            onClick={handleSyncFromUser}
          >
            Sync from User Profile
          </Button>
        </div>
      )}

      {/* Render Interleaved Groups and Ungrouped Fields */}
      <div className={s.fieldLayoutStack}>
        {interleavedItems.map((item) => {
          if (item.type === "fieldset") {
            const fieldset = item.data
            const fieldsInGroup = schema.filter(
              (f) => f.fieldset_id === fieldset.id
            )

            // Don't render empty fieldsets in the record form
            if (fieldsInGroup.length === 0) return null

            return (
              <Accordion.Root
                key={fieldset.id}
                type="multiple"
                defaultValue={defaultOpenValues}
                className={s.accordionRoot}
              >
                <Accordion.Item value={fieldset.id} className={s.accordionItem}>
                  <Accordion.Header className={s.accordionHeader}>
                    <Accordion.Trigger className={s.accordionTrigger}>
                      <span className={s.fieldsetLabel}>{fieldset.label}</span>
                      <ChevronDown className={s.accordionChevron} size={16} />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className={s.accordionContent}>
                    <div className={s.fieldsetFields}>
                      {fieldsInGroup.map((field) => renderField(field))}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
            )
          } else {
            return renderField(item.data)
          }
        })}
      </div>

      <div
        style={{
          marginTop: "24px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {id ? "Save Changes" : "Create Record"}
        </Button>
      </div>
    </form>
  )
}
