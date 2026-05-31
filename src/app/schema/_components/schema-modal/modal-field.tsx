"use client"

import { useState, useEffect } from "react"
import { TextField, SelectField, CheckboxField } from "@/components/fields"
import { useAuth } from "@/hooks/use-auth"
import { CMSField } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"
import s from "./style.module.css"

interface ModalFieldProps {
  mode: "create" | "edit" | "duplicate"
  fieldId?: string | null
  modelId: string
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Form component for creating, editing, or duplicating a model field.
 */
export default function ModalField({
  mode,
  fieldId,
  modelId,
  onSuccess,
  onCancel,
}: ModalFieldProps) {
  const { accessToken } = useAuth()

  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState(FIELD_DEFINITIONS[0].type)
  const [isRequired, setIsRequired] = useState(false)
  const [isUnique, setIsUnique] = useState(false)
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIdTouched, setIsIdTouched] = useState(false)

  // Fetch field data if in edit or duplicate mode
  useEffect(() => {
    const fetchFieldData = async () => {
      if (!fieldId || !accessToken || mode === "create" || !modelId) return

      try {
        const response = await fetch(
          `/api/models/schema/fields?model_id=${modelId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        if (!response.ok) throw new Error("Failed to fetch field data")

        const data = await response.json()
        const field = data.find((f: CMSField) => f.id === fieldId)

        if (field) {
          if (mode === "edit") {
            setLabel(field.field_label)
            setName(field.field_name)
            setType(field.field_type)
            setIsRequired(field.is_required)
            setIsUnique(field.is_unique)
            setNote(field.field_note || "")
            setIsIdTouched(true)
          } else {
            // Duplicate mode: Pre-fill with _copy and (copy)
            setLabel(`${field.field_label} (copy)`)
            setName(`${field.field_name}_copy`)
            setType(field.field_type)
            setIsRequired(field.is_required)
            setIsUnique(field.is_unique)
            setNote(field.field_note || "")
            setIsIdTouched(true)
          }
        }
      } catch (err) {
        console.error("Error fetching field for modal:", err)
      }
    }

    const timer = setTimeout(() => {
      if (mode === "create") {
        setLabel("")
        setName("")
        setType(FIELD_DEFINITIONS[0].type)
        setIsRequired(false)
        setIsUnique(false)
        setNote("")
        setIsIdTouched(false)
      } else {
        fetchFieldData()
      }
      setError(null)
    }, 0)
    return () => clearTimeout(timer)
  }, [mode, fieldId, accessToken, modelId])

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLabel(val)
    if (!isIdTouched && mode !== "edit") {
      setName(val.toLowerCase().replace(/[^a-z0-9]/g, "_"))
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsIdTouched(true)
    setName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    setIsSaving(true)
    setError(null)

    try {
      const isEdit = mode === "edit"
      const url = "/api/models/schema/fields"
      const method = isEdit ? "PATCH" : "POST"

      const body = isEdit
        ? {
            id: fieldId,
            field_label: label,
            field_note: note,
            is_required: isRequired,
            is_unique: isUnique,
          }
        : {
            model_id: modelId,
            field_name: name || label.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            field_label: label,
            field_type: type,
            is_required: isRequired,
            is_unique: isUnique,
          }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || `Failed to ${mode} field`)
      }

      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} field`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={s.modalForm}>
      {error && <p className={s.errorText}>{error}</p>}

      {mode === "edit" && (
        <>
          <TextField
            label="Field ID (UUID)"
            value={fieldId || ""}
            disabled
            description="The unique database identifier for this field."
          />
          <TextField
            label="Field Name (Database Column)"
            value={name}
            disabled
            description="The physical column name in your database."
          />
        </>
      )}

      <TextField
        label="Field Label"
        placeholder="e.g. Featured Image"
        value={label}
        onChange={handleLabelChange}
        required
        description="Human-friendly name for the field."
      />

      {mode !== "edit" && (
        <>
          <TextField
            label="Field Name (Database Column)"
            placeholder="e.g. featured_image"
            value={name}
            onChange={handleNameChange}
            description="The physical column name in your database."
          />

          <SelectField
            label="Field Type"
            value={type}
            onChange={(val) => setType(val as CMSField["field_type"])}
            options={FIELD_DEFINITIONS.map((def) => ({
              value: def.type,
              label: `${def.label} - ${def.description}`,
            }))}
          />
        </>
      )}

      {mode === "edit" && (
        <TextField
          label="Field Note"
          placeholder="e.g. This image is used on the home page."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          description="Internal description or help text for editors."
        />
      )}

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
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button type="submit" className={s.saveButton} disabled={isSaving}>
          {isSaving
            ? "Saving..."
            : mode === "edit"
              ? "Update Field"
              : mode === "duplicate"
                ? "Create Duplicate"
                : "Create Field"}
        </button>
      </div>
    </form>
  )
}
