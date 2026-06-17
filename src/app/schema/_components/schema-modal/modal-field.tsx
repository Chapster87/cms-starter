"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, Trash2, Settings, ShieldCheck, Palette } from "lucide-react"
import * as Tabs from "@radix-ui/react-tabs"
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
import { CMSField, CMSFieldOption, CMSFieldSettings } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"
import s from "./style.module.css"

const REGEX_PATTERNS: Record<string, string> = {
  email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  url: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
  numbers: "^[0-9]*$",
  alphanumeric: "^[a-zA-Z0-9]*$",
}

const REGEX_PRESETS = [
  { label: "None", value: "none" },
  { label: "Email", value: "email" },
  { label: "URL", value: "url" },
  { label: "Numbers Only", value: "numbers" },
  { label: "Alphanumeric", value: "alphanumeric" },
  { label: "Custom", value: "custom" },
]

const RICH_TEXT_TOOLS = [
  { id: "headings", label: "Headings" },
  { id: "bold", label: "Bold" },
  { id: "italic", label: "Italic" },
  { id: "underline", label: "Underline" },
  { id: "strike", label: "Strikethrough" },
  { id: "highlight", label: "Highlight" },
  { id: "align", label: "Alignment" },
  { id: "list_bullet", label: "Bullet List" },
  { id: "list_ordered", label: "Ordered List" },
  { id: "blockquote", label: "Blockquote" },
  { id: "hr", label: "Horizontal Rule" },
  { id: "link", label: "Links" },
  { id: "image", label: "Images" },
  { id: "color", label: "Text Color" },
  { id: "history", label: "Undo/Redo" },
]

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
  const { models: registeredModels } = useModels()

  const models = [
    ...registeredModels,
    {
      id: "users",
      table_name: "users",
      friendly_name: "CMS Users",
      slug: "users",
    },
  ]
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
  const [enabledTools, setEnabledTools] = useState<string[]>(
    RICH_TEXT_TOOLS.map((t) => t.id)
  )

  // New settings
  const [placeholder, setPlaceholder] = useState("")
  const [helpText, setHelpText] = useState("")
  const [min, setMin] = useState<number | "">("")
  const [max, setMax] = useState<number | "">("")
  const [step, setStep] = useState<number | "">("")
  const [minLength, setMinLength] = useState<number | "">("")
  const [maxLength, setMaxLength] = useState<number | "">("")
  const [regexPattern, setRegexPattern] = useState("")
  const [regexPreset, setRegexPreset] = useState("none")

  const hasValidationSettings =
    type === "number" ||
    type === "text_single" ||
    type === "text_multi" ||
    type === "rich_text"

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
            setEnabledTools(
              (settings.enabled_tools as string[]) ||
                RICH_TEXT_TOOLS.map((t) => t.id)
            )

            // Load new settings
            setPlaceholder((settings.placeholder as string) || "")
            setHelpText((settings.help_text as string) || "")
            setMin((settings.min as number) ?? "")
            setMax((settings.max as number) ?? "")
            setStep((settings.step as number) ?? "")
            setMinLength((settings.min_length as number) ?? "")
            setMaxLength((settings.max_length as number) ?? "")
            const pattern = (settings.regex_pattern as string) || ""
            setRegexPattern(pattern)

            // Detect preset
            if (pattern === "") {
              setRegexPreset("none")
            } else {
              const presetKey = Object.keys(REGEX_PATTERNS).find(
                (key) => REGEX_PATTERNS[key] === pattern
              )
              setRegexPreset(presetKey || "custom")
            }

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
            setEnabledTools(
              (settings.enabled_tools as string[]) ||
                RICH_TEXT_TOOLS.map((t) => t.id)
            )

            // Load new settings
            setPlaceholder((settings.placeholder as string) || "")
            setHelpText((settings.help_text as string) || "")
            setMin((settings.min as number) ?? "")
            setMax((settings.max as number) ?? "")
            setStep((settings.step as number) ?? "")
            setMinLength((settings.min_length as number) ?? "")
            setMaxLength((settings.max_length as number) ?? "")
            const pattern = (settings.regex_pattern as string) || ""
            setRegexPattern(pattern)

            // Detect preset
            if (pattern === "") {
              setRegexPreset("none")
            } else {
              const presetKey = Object.keys(REGEX_PATTERNS).find(
                (key) => REGEX_PATTERNS[key] === pattern
              )
              setRegexPreset(presetKey || "custom")
            }

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

      const settings: CMSFieldSettings = {
        placeholder: placeholder || undefined,
        help_text: helpText || undefined,
      }

      if (type === "number") {
        settings.min = min !== "" ? Number(min) : undefined
        settings.max = max !== "" ? Number(max) : undefined
        settings.step = step !== "" ? Number(step) : undefined
      }

      if (
        type === "text_single" ||
        type === "text_multi" ||
        type === "rich_text"
      ) {
        settings.min_length = minLength !== "" ? Number(minLength) : undefined
        settings.max_length = maxLength !== "" ? Number(maxLength) : undefined
        settings.regex_pattern = regexPattern || undefined
      }

      if (type === "reference") {
        settings.allowed_models = allowedModels
        settings.allow_multiple = allowMultiple
      } else if (type === "media") {
        settings.allow_multiple = allowMultiple
      } else if (type === "navigation") {
        settings.allowed_models = allowedModels
      } else if (type === "select") {
        settings.choices = choices
      } else if (type === "date_time") {
        settings.include_time = includeTime
      } else if (type === "rich_text") {
        settings.enabled_tools = enabledTools
      }

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

      <Tabs.Root defaultValue="basic" className={s.tabsRoot}>
        <Tabs.List className={s.tabsList}>
          <Tabs.Trigger value="basic" className={s.tabsTrigger}>
            <Settings size={14} style={{ marginRight: "8px" }} /> Basic
          </Tabs.Trigger>
          {hasValidationSettings && (
            <Tabs.Trigger value="validation" className={s.tabsTrigger}>
              <ShieldCheck size={14} style={{ marginRight: "8px" }} />{" "}
              Validation
            </Tabs.Trigger>
          )}
          <Tabs.Trigger value="appearance" className={s.tabsTrigger}>
            <Palette size={14} style={{ marginRight: "8px" }} /> Appearance
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="basic" className={s.tabsContent}>
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

          <div className={s.settingsGrid}>
            <CheckboxField
              label="Required Field"
              checked={isRequired}
              onChange={setIsRequired}
              description="Make mandatory."
              variant="switch"
            />

            <CheckboxField
              label="Unique Constraint"
              checked={isUnique}
              onChange={setIsUnique}
              description="Prevent duplicates."
              variant="switch"
            />
          </div>
        </Tabs.Content>

        {hasValidationSettings && (
          <Tabs.Content value="validation" className={s.tabsContent}>
            {type === "number" && (
              <div className={s.settingsGrid}>
                <TextField
                  label="Minimum Value"
                  type="number"
                  value={min}
                  onChange={(e) =>
                    setMin(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="No min"
                />
                <TextField
                  label="Maximum Value"
                  type="number"
                  value={max}
                  onChange={(e) =>
                    setMax(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="No max"
                />
                <TextField
                  label="Step"
                  type="number"
                  value={step}
                  onChange={(e) =>
                    setStep(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="e.g. 1 or 0.1"
                  className={s.fullWidth}
                />
              </div>
            )}

            {(type === "text_single" ||
              type === "text_multi" ||
              type === "rich_text") && (
              <div className={s.settingsGrid}>
                <TextField
                  label="Min Length"
                  type="number"
                  value={minLength}
                  onChange={(e) =>
                    setMinLength(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="e.g. 0"
                />
                <TextField
                  label="Max Length"
                  type="number"
                  value={maxLength}
                  onChange={(e) =>
                    setMaxLength(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="e.g. 255"
                />
                <SelectField
                  label="Regex Validation"
                  value={regexPreset}
                  onChange={(val) => {
                    setRegexPreset(val)
                    if (val === "none") {
                      setRegexPattern("")
                    } else if (val === "custom") {
                      // Keep existing pattern or clear if it was a preset
                      const isPreset =
                        Object.values(REGEX_PATTERNS).includes(regexPattern)
                      if (isPreset) setRegexPattern("")
                    } else {
                      setRegexPattern(REGEX_PATTERNS[val] || "")
                    }
                  }}
                  options={REGEX_PRESETS}
                  description="Choose a common pattern or create a custom one."
                />
                {regexPreset === "custom" && (
                  <TextField
                    label="Custom Regex Pattern"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    placeholder="e.g. ^[a-z]+$"
                    className={s.fullWidth}
                    description="Enter your custom regular expression."
                  />
                )}
              </div>
            )}
          </Tabs.Content>
        )}

        <Tabs.Content value="appearance" className={s.tabsContent}>
          <div className={s.settingsGrid}>
            <TextField
              label="Placeholder Text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Enter placeholder..."
              className={s.fullWidth}
            />
            <TextField
              label="Help Text"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Instructional text for editors..."
              className={s.fullWidth}
            />
          </div>

          {type === "rich_text" && (
            <div className={s.referenceSettings}>
              <hr className={s.separator} />
              <h4 className={s.settingsTitle}>Enabled Tools</h4>
              <div className={s.checkboxGroup}>
                {RICH_TEXT_TOOLS.map((tool) => (
                  <CheckboxField
                    key={tool.id}
                    label={tool.label}
                    checked={enabledTools.includes(tool.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setEnabledTools([...enabledTools, tool.id])
                      } else {
                        setEnabledTools(
                          enabledTools.filter((t) => t !== tool.id)
                        )
                      }
                    }}
                  />
                ))}
              </div>
              <p className={s.fieldDescription}>
                Uncheck tools to disable them in the editor. If all are
                unchecked, the editor will show a minimal interface.
              </p>
            </div>
          )}

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
                <label className={s.fieldLabel}>
                  Allow internal links from:
                </label>
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
        </Tabs.Content>
      </Tabs.Root>

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
