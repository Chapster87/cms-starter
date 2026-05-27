"use client"

import { useState, useEffect, useCallback } from "react"
import { TextField, SelectField, CheckboxField } from "@/components/fields"
import { useAuth } from "@/hooks/use-auth"
import { CMSField } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"
import s from "./style.module.css"

interface FieldListProps {
  modelId: string
}

/**
 * Manages the listing and creation of fields for a model.
 */
export default function FieldList({ modelId }: FieldListProps) {
  const { accessToken } = useAuth()
  const [fields, setFields] = useState<CMSField[]>([])
  const [unregisteredCount, setUnregisteredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Form State
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState(FIELD_DEFINITIONS[0].type)
  const [isRequired, setIsRequired] = useState(false)
  const [isUnique, setIsUnique] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchFields = useCallback(async () => {
    if (!modelId) return

    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      // 1. Fetch registered fields
      const response = await fetch(
        `/api/models/schema/fields?model_id=${modelId}`,
        { headers }
      )
      if (!response.ok) throw new Error("Failed to fetch registered fields")
      const data = await response.json()
      setFields(data)

      // 2. Resolve table name to check for unregistered columns
      const { data: modelData } = await (
        await import("@/utils/supabaseClient")
      ).supabase
        .from("models")
        .select("table_name")
        .eq("id", modelId)
        .single()

      if (modelData) {
        // Fetch physical columns (requires auth)
        const schemaRes = await fetch(
          `/api/models/schema?table=${modelData.table_name}`,
          { headers }
        )
        if (schemaRes.ok) {
          const physicalCols = await schemaRes.json()
          const registeredNames = new Set(data.map((f: any) => f.field_name))
          const systemFields = ["id", "created_at", "updated_at"]
          const missing = physicalCols.filter(
            (c: any) =>
              !registeredNames.has(c.column_name) &&
              !systemFields.includes(c.column_name)
          )
          setUnregisteredCount(missing.length)
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }, [modelId, accessToken])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFields()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchFields, accessToken])

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/models/schema/fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          model_id: modelId,
          field_name:
            newFieldName ||
            newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          field_label: newFieldLabel,
          field_type: newFieldType,
          is_required: isRequired,
          is_unique: isUnique,
        }),
      })

      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || "Failed to create field")

      await fetchFields()
      setIsModalOpen(false)
      resetForm()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create field")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSync = async () => {
    if (!accessToken || !modelId) return
    setIsSyncing(true)
    try {
      const { data: modelData } = await (
        await import("@/utils/supabaseClient")
      ).supabase
        .from("models")
        .select("table_name")
        .eq("id", modelId)
        .single()

      if (!modelData) throw new Error("Could not resolve table name")

      const response = await fetch("/api/models/schema/fields/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          model_id: modelId,
          table_name: modelData.table_name,
        }),
      })

      if (!response.ok) throw new Error("Failed to sync fields")
      await fetchFields()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  const resetForm = () => {
    setNewFieldLabel("")
    setNewFieldName("")
    setNewFieldType(FIELD_DEFINITIONS[0].type)
    setIsRequired(false)
    setIsUnique(false)
    setError(null)
  }

  if (loading) return <p>Loading fields...</p>

  /**
   * Returns a category class for icon styling based on field type.
   */
  const getIconCategory = (type: string) => {
    if (type.includes("text")) return s.icon_text
    if (type.includes("media")) return s.icon_media
    if (type.includes("json")) return s.icon_json
    if (type.includes("seo")) return s.icon_seo
    if (type.includes("boolean")) return s.icon_boolean
    return s.icon_text
  }

  return (
    <div className={s.fieldListContainer}>
      <div className={s.header}>
        <div className={s.headerTitleGroup}>
          <h2>Model Fields</h2>
          {unregisteredCount > 0 && (
            <span className={s.syncHint}>
              {unregisteredCount} existing columns detected.
              <button
                className={s.syncButton}
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? "Syncing..." : "Import them"}
              </button>
            </span>
          )}
        </div>
        <button
          className={s.addFieldButton}
          onClick={() => setIsModalOpen(true)}
        >
          <span>+</span> Add new field
        </button>
      </div>

      <div className={s.fieldStack}>
        {fields.length === 0 && !loading && (
          <p className={s.emptyState}>
            No fields added yet. Click "+ Add new field" to get started.
          </p>
        )}
        {fields.map((field) => {
          const definition = FIELD_DEFINITIONS.find(
            (d) => d.type === field.field_type
          )
          return (
            <div key={field.id} className={s.fieldCard}>
              <div className={s.dragHandle}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="16" y2="6"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                  <line x1="8" y1="18" x2="16" y2="18"></line>
                </svg>
              </div>

              <div
                className={`${s.fieldIcon} ${getIconCategory(field.field_type)}`}
              >
                {field.field_type === "json" ? "{...}" : "A"}
              </div>

              <div className={s.fieldContent}>
                <div className={s.fieldMainInfo}>
                  <span
                    className={`${s.fieldLabel} ${
                      field.is_required ? s.fieldLabelRequired : ""
                    }`}
                  >
                    {field.field_label}
                  </span>
                  <span className={s.fieldName}>{field.field_name}</span>
                </div>
                <div className={s.fieldTypeLabel}>
                  {definition?.label || field.field_type}
                </div>
              </div>

              <div className={s.fieldBadges}>
                {field.is_unique && (
                  <span className={s.uniqueBadge}>Unique</span>
                )}
                {field.is_system && (
                  <span className={s.systemBadge}>System</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <h3>Add New Field</h3>
            {error && <p className={s.errorText}>{error}</p>}

            <form onSubmit={handleCreateField} className={s.modalForm}>
              <TextField
                label="Field Label"
                placeholder="e.g. Featured Image"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                required
                description="Human-friendly name for the field."
              />

              <TextField
                label="Field Name (Database Column)"
                placeholder="e.g. featured_image"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                description="The physical column name in your database."
              />

              <SelectField
                label="Field Type"
                value={newFieldType}
                onChange={(val) =>
                  setNewFieldType(val as CMSField["field_type"])
                }
                options={FIELD_DEFINITIONS.map((def) => ({
                  value: def.type,
                  label: `${def.label} - ${def.description}`,
                }))}
              />

              <CheckboxField
                label="Required Field"
                checked={isRequired}
                onChange={setIsRequired}
                description="Make this field mandatory."
                variant="switch"
              />

              <CheckboxField
                label="Unique Constraint"
                checked={isUnique}
                onChange={setIsUnique}
                description="Prevent duplicate values in this column."
                variant="switch"
              />

              <div className={s.modalActions}>
                <button
                  type="button"
                  className={s.cancelButton}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={s.saveButton}
                  disabled={isSaving}
                >
                  {isSaving ? "Creating..." : "Create Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
