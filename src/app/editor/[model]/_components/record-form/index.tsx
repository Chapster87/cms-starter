"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import {
  TextField,
  NumberField,
  MarkdownField,
  RichTextField,
  SelectField,
  CheckboxField,
  JsonField,
  TagField,
  ColorField,
  MediaField,
  SlugField,
  SeoField,
  DateField,
  ReferenceField,
  NavigationField,
  StandingsField,
} from "@/components/fields"
import Button from "@/components/button"
import { useAuth } from "@/hooks/use-auth"
import { useUsers } from "@/hooks/use-users"
import { CMSField } from "@/types/fields"
import { toast } from "@/client/toast-store"
import {
  MediaAsset,
  NavigationData,
  CMSModelMap,
  CMSModelName,
} from "@/types/cms-generated"
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
  hasDraftMode,
}: RecordFormProps<T>) {
  const { accessToken } = useAuth()
  const { users } = useUsers()
  const [schema, setSchema] = useState<CMSField[]>([])

  // Use a more flexible internal type for the form data while keeping the component generic
  const [formData, setFormData] = useState<Record<string, unknown>>(
    (initialData as Record<string, unknown>) || {}
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fetchingSchema, setFetchingSchema] = useState(true)

  /**
   * Internal helper for accessing form data dynamically.
   */
  function getFieldValue(key: string): unknown {
    return formData[key]
  }

  /**
   * Validates a single field and updates the error state.
   */
  function validateField(name: string, value: unknown, isRequired?: boolean) {
    if (isRequired && (value === undefined || value === null || value === "")) {
      setErrors((prev) => ({ ...prev, [name]: "This field is required" }))
      return false
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
    return true
  }

  // Sync internal form data with initialData when it changes from above
  useEffect(() => {
    if (initialData) {
      // Proactively "unwrap" stringified JSON for media/json fields on load
      const unwrappedData = { ...initialData } as Record<string, unknown>

      // We don't have schema yet in this effect usually, so we'll do a general check
      // or rely on the fact that these strings look like JSON.
      Object.keys(unwrappedData).forEach((key) => {
        const val = (unwrappedData as Record<string, unknown>)[key]
        if (
          typeof val === "string" &&
          (val.trim().startsWith("{") || val.trim().startsWith("["))
        ) {
          try {
            unwrappedData[key] = JSON.parse(val)
          } catch (e) {
            /* ignore */
          }
        }
      })

      const timer = setTimeout(() => {
        setFormData(unwrappedData)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [initialData])

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
              !["_draft", "status", "created_by", "updated_by"].includes(
                f.field_name
              )
          )
          setSchema(filteredData)
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
              field_name: f.column_name,
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

  function handleChange(columnName: string, value: unknown) {
    const nextData = {
      ...formData,
      [columnName]: value,
    }

    const field = schema.find((f) => f.field_name === columnName)
    validateField(columnName, value, field?.is_required)

    // Auto-sync from user if linking for the first time
    if ((model as string) === "authors" && columnName === "user_id" && value) {
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
          toast.info(`Auto-populated from ${linkedUser.display_name || "user"}`)
        }
      }
    }

    setFormData(nextData)
    if (onAutoSave) {
      onAutoSave(nextData as Partial<CMSModelMap[T]>)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Perform full validation
    const nextErrors: Record<string, string> = {}
    let hasErrors = false

    schema.forEach((field) => {
      const val = formData[field.field_name]
      if (
        field.is_required &&
        (val === undefined || val === null || val === "")
      ) {
        nextErrors[field.field_name] = "This field is required"
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
    schema.forEach((field) => {
      // Remove computed fields from payload
      if (field.is_computed) {
        delete cleanData[field.field_name]
        return
      }

      const val = cleanData[field.field_name]

      // Force relationship fields on 'teams' model to stay as arrays for jsonb compatibility
      if (
        (model as string) === "teams" &&
        (field.field_name === "league" || field.field_name === "division")
      ) {
        if (val && !Array.isArray(val)) {
          cleanData[field.field_name] = [val]
        }
      }

      // 1. Unwrap stringified media/json fields
      if (
        (field.field_type === "media" || field.field_type === "json") &&
        typeof val === "string" &&
        (val.startsWith("{") || val.startsWith("["))
      ) {
        try {
          cleanData[field.field_name] = JSON.parse(val)
        } catch (e) {
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
          (field.field_name === "league" || field.field_name === "division")

        if (
          !isMultiple &&
          !isTeamsSpecialField &&
          Array.isArray(val) &&
          val.length > 0
        ) {
          cleanData[field.field_name] = val[0]
        }
      }
    })

    onSubmit(cleanData as Partial<CMSModelMap[T]>)
  }

  function handleSyncFromUser() {
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
  }

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
      {schema.map((field) => {
        const isComputed = !!field.is_computed
        const commonProps = {
          label: field.field_label as string,
          description: field.field_description as string | undefined,
          fieldNote: (field.field_note as string) || undefined,
          required: field.is_required,
          disabled: isLoading || isComputed,
          name: field.field_name,
          error: errors[field.field_name],
        }

        const value = getFieldValue(field.field_name)

        if (field.field_type === "boolean") {
          return (
            <CheckboxField
              key={field.field_name}
              {...commonProps}
              checked={!!value}
              onChange={(checked) => handleChange(field.field_name, checked)}
            />
          )
        }

        if (field.field_type === "number") {
          return (
            <NumberField
              key={field.field_name}
              {...commonProps}
              value={(value as number) ?? ""}
              onChange={(val) => handleChange(field.field_name, val)}
              min={field.settings?.min}
              max={field.settings?.max}
              step={field.settings?.step}
              placeholder={field.settings?.placeholder}
            />
          )
        }

        if (field.field_type === "text_multi") {
          return (
            <MarkdownField
              key={field.field_name}
              {...commonProps}
              value={(value as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
              rows={6}
              placeholder={field.settings?.placeholder}
            />
          )
        }

        if (field.field_type === "rich_text") {
          return (
            <RichTextField
              key={field.field_name}
              {...commonProps}
              value={(value as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
              enabledTools={field.settings?.enabled_tools}
              placeholder={field.settings?.placeholder}
            />
          )
        }

        if (field.field_type === "select") {
          return (
            <SelectField
              key={field.field_name}
              field={field}
              value={(value as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "color") {
          return (
            <ColorField
              key={field.field_name}
              {...commonProps}
              value={(value as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "seo_slug" || field.field_name === "slug") {
          // Attempt to find a "source" field for the slug (like 'title' or 'name')
          const sourceField = schema.find(
            (f) =>
              f.field_name === "title" ||
              f.field_name === "name" ||
              f.field_label.toLowerCase() === "title" ||
              f.field_label.toLowerCase() === "name"
          )
          const sourceValue = sourceField
            ? (getFieldValue(sourceField.field_name) as string)
            : ""

          return (
            <SlugField
              key={field.field_name}
              {...commonProps}
              value={(value as string) || ""}
              sourceValue={sourceValue}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "media") {
          const settings = (field.settings || {}) as Record<string, unknown>
          const isMultiple =
            settings.multiple === true || settings.allow_multiple === true

          return (
            <MediaField
              key={field.field_name}
              {...commonProps}
              value={value as string | MediaAsset | MediaAsset[]}
              onChange={(val) => handleChange(field.field_name, val)}
              multiple={isMultiple}
            />
          )
        }

        if (field.field_type === "seo_metadata") {
          return (
            <SeoField
              key={field.field_name}
              {...commonProps}
              value={(value as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "tags") {
          return (
            <TagField
              key={field.field_name}
              {...commonProps}
              value={(value as string) || []}
              onChange={(val) => handleChange(field.field_name, val)}
              placeholder={field.settings?.placeholder}
            />
          )
        }

        if (["json", "modular_content"].includes(field.field_type)) {
          const jsonValue =
            typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : (value as string) || ""

          return (
            <JsonField
              key={field.field_name}
              {...commonProps}
              value={jsonValue}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "date_time") {
          const settings = (field.settings || {}) as Record<string, unknown>
          const showTime = settings.include_time !== false

          return (
            <DateField
              key={field.field_name}
              {...commonProps}
              showTime={showTime}
              value={(value as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "reference") {
          const settings = (field.settings || {}) as Record<string, unknown>
          return (
            <ReferenceField
              key={field.field_name}
              {...commonProps}
              allowedModels={(settings.allowed_models as string[]) || []}
              allowMultiple={!!settings.allow_multiple}
              value={(value as string | string[]) || null}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "navigation") {
          const settings = (field.settings || {}) as Record<string, unknown>
          return (
            <NavigationField
              key={field.field_name}
              {...commonProps}
              value={(value as NavigationData) || null}
              onChange={(val) => handleChange(field.field_name, val)}
              settings={settings}
            />
          )
        }

        if (field.field_type === "standings_table") {
          // Resolve dependency values. We look for 'league', 'division' and 'season' columns.
          // In ReferenceField, the value is often an array (e.g., [uuid]).
          const leagueId = getFieldValue("league") as
            | string
            | string[]
            | undefined
          const divisionId = getFieldValue("division") as
            | string
            | string[]
            | undefined
          const seasonId = getFieldValue("season") as
            | string
            | string[]
            | undefined

          return (
            <StandingsField
              key={field.field_name}
              {...commonProps}
              value={(value as string) || []}
              onChange={(val: unknown) => handleChange(field.field_name, val)}
              leagueId={Array.isArray(leagueId) ? leagueId[0] : leagueId}
              divisionId={
                Array.isArray(divisionId) ? divisionId[0] : divisionId
              }
              seasonId={Array.isArray(seasonId) ? seasonId[0] : seasonId}
            />
          )
        }

        return (
          <TextField
            key={field.field_name}
            {...commonProps}
            value={(value as string) || ""}
            onChange={(e) => handleChange(field.field_name, e.target.value)}
            placeholder={field.settings?.placeholder}
            minLength={field.settings?.min_length}
            maxLength={field.settings?.max_length}
            pattern={field.settings?.regex_pattern}
          />
        )
      })}

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
