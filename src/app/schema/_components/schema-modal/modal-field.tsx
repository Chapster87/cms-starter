"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import {
  TextField,
  SelectField,
  CheckboxField,
  SlugField,
} from "@/components/fields"
import { toast } from "@/client/toast-store"
import { useAuth } from "@/hooks/use-auth"
import { useModels } from "@/hooks/use-models"
import Button from "@/components/button"
import { CMSField, CMSFieldOption } from "@/types/fields"
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
  const { models } = useModels()
  const router = useRouter()
  const searchParams = useSearchParams()

  const fieldTypeFromUrl = searchParams.get("fieldType") as
    | CMSField["field_type"]
    | null

  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<CMSField["field_type"]>(
    fieldTypeFromUrl || FIELD_DEFINITIONS[0].type
  )
  const [isRequired, setIsRequired] = useState(false)
  const [isUnique, setIsUnique] = useState(false)
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIdTouched, setIsIdTouched] = useState(false)
  const [existingFields, setExistingFields] = useState<CMSField[]>([])

  // Reference field specific settings
  const [allowedModels, setAllowedModels] = useState<string[]>([])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [choices, setChoices] = useState<CMSFieldOption[]>([])
  const [includeTime, setIncludeTime] = useState(true)

  // Fetch field data
  useEffect(() => {
    const fetchFieldData = async () => {
      if (!accessToken || !modelId) return

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

        const data = (await response.json()) as CMSField[]
        setExistingFields(data)

        if (mode === "create" || !fieldId) return

        const field = data.find((f: CMSField) => f.id === fieldId)

        if (field) {
          const settings = (field.settings || {}) as Record<string, unknown>
          const fieldChoices = (settings.choices as CMSFieldOption[]) || []

          if (mode === "edit") {
            setLabel(field.field_label)
            setName(field.field_name)
            setType(field.field_type)
            setIsRequired(field.is_required)
            setIsUnique(field.is_unique)
            setNote(field.field_note || "")
            setIsIdTouched(true)
            setChoices(fieldChoices)
            if (field.field_type === "date_time") {
              setIncludeTime(settings.include_time !== false)
            }

            if (
              field.field_type === "reference" ||
              field.field_type === "navigation" ||
              field.field_type === "media"
            ) {
              const allowed = settings.allowed_models as string[] | undefined
              setAllowedModels(allowed || [])
              if (
                field.field_type === "reference" ||
                field.field_type === "media"
              ) {
                setAllowMultiple(!!settings.allow_multiple)
              }
            }
          } else {
            // Duplicate mode: Pre-fill with _copy and (copy)
            setLabel(`${field.field_label} (copy)`)
            setName(`${field.field_name}_copy`)
            setType(field.field_type)
            setIsRequired(field.is_required)
            setIsUnique(field.is_unique)
            setNote(field.field_note || "")
            setIsIdTouched(true)
            setChoices(fieldChoices)
            if (field.field_type === "date_time") {
              setIncludeTime(settings.include_time !== false)
            }

            if (
              field.field_type === "reference" ||
              field.field_type === "navigation" ||
              field.field_type === "media"
            ) {
              const allowed = settings.allowed_models as string[] | undefined
              setAllowedModels(allowed || [])
              if (
                field.field_type === "reference" ||
                field.field_type === "media"
              ) {
                setAllowMultiple(!!settings.allow_multiple)
              }
            }
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
        setType(fieldTypeFromUrl || FIELD_DEFINITIONS[0].type)
        setIsRequired(false)
        setIsUnique(false)
        setNote("")
        setIsIdTouched(false)
        fetchFieldData() // Still fetch existing fields to calculate order
      } else {
        fetchFieldData()
      }
      setError(null)
    }, 0)
    return () => clearTimeout(timer)
  }, [mode, fieldId, accessToken, modelId, fieldTypeFromUrl])

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value)
  }

  const handleAddChoice = () => {
    setChoices([...choices, { label: "", value: "" }])
  }

  const handleRemoveChoice = (index: number) => {
    const newChoices = [...choices]
    newChoices.splice(index, 1)
    setChoices(newChoices)
  }

  const handleUpdateChoice = (
    index: number,
    key: "label" | "value",
    val: string
  ) => {
    const newChoices = [...choices]
    const oldChoice = newChoices[index]

    if (key === "label") {
      const oldAutoValue = oldChoice.label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")

      // Auto-fill value if it matches the previous auto-generated value or is empty
      if (!oldChoice.value || oldChoice.value === oldAutoValue) {
        newChoices[index] = {
          ...oldChoice,
          label: val,
          value: val.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        }
      } else {
        newChoices[index] = { ...oldChoice, label: val }
      }
    } else {
      newChoices[index] = { ...oldChoice, [key]: val }
    }
    setChoices(newChoices)
  }

  const handleBack = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("fieldType")
    router.push(`?${nextParams.toString()}`)
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    setIsSaving(true)
    setError(null)

    try {
      const isEdit = mode === "edit"
      const url = "/api/models/schema/fields"
      const method = isEdit ? "PATCH" : "POST"

      // Calculate next UI order for new fields
      const nextUiOrder =
        existingFields.length > 0
          ? Math.max(...existingFields.map((f) => f.ui_order || 0)) + 1
          : 0

      const settings =
        type === "reference"
          ? {
              allowed_models: allowedModels,
              allow_multiple: allowMultiple,
            }
          : type === "media"
            ? {
                allow_multiple: allowMultiple,
              }
            : type === "navigation"
              ? {
                  allowed_models: allowedModels,
                }
              : type === "select"
                ? {
                    choices,
                  }
                : type === "date_time"
                  ? {
                      include_time: includeTime,
                    }
                  : {}

      const body = isEdit
        ? {
            id: fieldId,
            field_label: label,
            field_note: note,
            is_required: isRequired,
            is_unique: isUnique,
            settings,
          }
        : {
            model_id: modelId,
            field_name: name || label.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            field_label: label,
            field_type: type,
            is_required: isRequired,
            is_unique: isUnique,
            ui_order: nextUiOrder,
            settings,
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

      toast.success(
        `Field ${mode === "edit" ? "updated" : mode === "duplicate" ? "duplicated" : "created"}`,
        `Field "${label}" has been saved.`
      )
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${mode} field`
      setError(msg)
      toast.error("Error saving field", msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={s.modalForm}>
      {mode === "create" && (
        <div className={s.modalNav}>
          <Button
            type="button"
            unstyled
            className={s.backButton}
            onClick={handleBack}
            beforeText={
              <svg>
                <use xlinkHref="/feather-sprite.svg#chevron-left" />
              </svg>
            }
          >
            Back to type selection
          </Button>
        </div>
      )}

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
          <SlugField
            label="Field Name (Database Column)"
            placeholder="e.g. featured_image"
            value={name}
            sourceValue={label}
            onChange={setName}
            separator="_"
            isTouched={isIdTouched}
            onToggleTouched={setIsIdTouched}
            description="The physical column name in your database."
          />

          {!fieldTypeFromUrl && (
            <SelectField
              label="Field Type"
              value={type}
              onChange={(val) => setType(val as CMSField["field_type"])}
              options={FIELD_DEFINITIONS.map((def) => ({
                value: def.type,
                label: `${def.label} - ${def.description}`,
              }))}
            />
          )}
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

      {type === "select" && (
        <div className={s.referenceSettings}>
          <hr className={s.separator} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4 className={s.settingsTitle}>Dropdown Options</h4>
            <Button
              type="button"
              unstyled
              onClick={handleAddChoice}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "var(--color-primary)",
              }}
            >
              <Plus size={14} /> Add Option
            </Button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            {choices.map((choice, index) => (
              <div key={index} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className={s.nameInput}
                  placeholder="Label (e.g. Red)"
                  value={choice.label}
                  onChange={(e) =>
                    handleUpdateChoice(index, "label", e.target.value)
                  }
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className={s.nameInput}
                  placeholder="Value (e.g. red)"
                  value={choice.value}
                  onChange={(e) =>
                    handleUpdateChoice(index, "value", e.target.value)
                  }
                  style={{ flex: 1 }}
                />
                <Button
                  type="button"
                  unstyled
                  onClick={() => handleRemoveChoice(index)}
                  style={{
                    padding: "0 8px",
                    color: "var(--color-grey-400)",
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            {choices.length === 0 && (
              <p className={s.fieldDescription}>No options added yet.</p>
            )}
          </div>
        </div>
      )}

      {type === "reference" && (
        <div className={s.referenceSettings}>
          <hr className={s.separator} />
          <h4 className={s.settingsTitle}>Linked Record Settings</h4>

          <div className={s.modelsGrid}>
            <label className={s.fieldLabel}>Allow selection from:</label>
            <div className={s.checkboxGroup}>
              {models.map((model) => (
                <CheckboxField
                  key={model.id}
                  label={model.friendly_name}
                  checked={allowedModels.includes(model.id)}
                  onChange={(checked) => {
                    if (checked) {
                      setAllowedModels([...allowedModels, model.id])
                    } else {
                      setAllowedModels(
                        allowedModels.filter((id) => id !== model.id)
                      )
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <CheckboxField
            label="Allow Multiple Selection"
            checked={allowMultiple}
            onChange={setAllowMultiple}
            description="Allow editors to select more than one record."
            variant="switch"
          />
        </div>
      )}

      {type === "navigation" && (
        <div className={s.referenceSettings}>
          <hr className={s.separator} />
          <h4 className={s.settingsTitle}>Navigation Link Settings</h4>

          <div className={s.modelsGrid}>
            <label className={s.fieldLabel}>Allow internal links from:</label>
            <div className={s.checkboxGroup}>
              {models.map((model) => (
                <CheckboxField
                  key={model.id}
                  label={model.friendly_name}
                  checked={allowedModels.includes(model.id)}
                  onChange={(checked) => {
                    if (checked) {
                      setAllowedModels([...allowedModels, model.id])
                    } else {
                      setAllowedModels(
                        allowedModels.filter((id) => id !== model.id)
                      )
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {type === "date_time" && (
        <div className={s.referenceSettings}>
          <hr className={s.separator} />
          <h4 className={s.settingsTitle}>Date Settings</h4>
          <CheckboxField
            label="Include Time"
            checked={includeTime}
            onChange={setIncludeTime}
            description="Enable time selection alongside the date."
            variant="switch"
          />
        </div>
      )}

      {type === "media" && (
        <div className={s.referenceSettings}>
          <hr className={s.separator} />
          <h4 className={s.settingsTitle}>Media Asset Settings</h4>
          <CheckboxField
            label="Multiple Assets"
            checked={allowMultiple}
            onChange={setAllowMultiple}
            description="Allow editors to upload more than one image or file."
            variant="switch"
          />
        </div>
      )}

      <div className={s.modalActions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSaving} disabled={isSaving}>
          {mode === "edit"
            ? "Update Field"
            : mode === "duplicate"
              ? "Create Duplicate"
              : "Create Field"}
        </Button>
      </div>
    </form>
  )
}
