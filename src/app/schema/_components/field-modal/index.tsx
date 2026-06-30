"use client"

import { useState, useEffect } from "react"
import clsx from "clsx"
import {
  FileText,
  Type,
  Layers,
  Database,
  ExternalLink,
  Settings,
  ShieldCheck,
  Palette,
  Plus,
  Trash2,
} from "lucide-react"

import Button from "@/components/button"
import {
  TextField,
  SelectField,
  CheckboxField,
  SlugField,
} from "@/components/fields"
import Modal from "@/components/modal"
import Tabs from "@/components/tabs"
import { useModels } from "@/hooks/use-models"
import { CMSField, CMSFieldset, CMSBlock, CMSFieldOption } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"

import s from "./style.module.css"

const REGEX_PATTERNS: Record<string, string> = {
  email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  url: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
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

interface FieldModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  modelId: string
  blockId?: string
  accessToken: string | null
  field?: CMSField | null // If present, we are in edit or duplicate mode
  mode?: "create" | "edit" | "duplicate"
  fieldsets?: CMSFieldset[]
}

/**
 * A reusable modal for creating, editing, and duplicating model fields.
 */
export default function FieldModal({
  isOpen,
  onOpenChange,
  onSuccess,
  modelId,
  blockId,
  accessToken,
  field,
  mode = "create",
  fieldsets = [],
}: FieldModalProps) {
  const [modalStep, setModalStep] = useState<1 | 2>(mode === "create" ? 1 : 2)
  const [label, setLabel] = useState("")
  const [slug, setSlug] = useState("")
  const [type, setType] = useState(FIELD_DEFINITIONS[0].type)
  const [isRequired, setIsRequired] = useState(false)
  const [isUnique, setIsUnique] = useState(false)
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [note, setNote] = useState("")
  const [fieldsetId, setFieldsetId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableBlocks, setAvailableBlocks] = useState<CMSBlock[]>([])

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

  // Advanced settings state
  const [placeholder, setPlaceholder] = useState("")
  const [helpText, setHelpText] = useState("")
  const [min, setMin] = useState<number | "">("")
  const [max, setMax] = useState<number | "">("")
  const [settingStep, setSettingStep] = useState<number | "">("")
  const [minLength, setMinLength] = useState<number | "">("")
  const [maxLength, setMaxLength] = useState<number | "">("")
  const [minItems, setMinItems] = useState<number | "">("")
  const [maxItems, setMaxItems] = useState<number | "">("")
  const [regexPattern, setRegexPattern] = useState("")
  const [regexPreset, setRegexPreset] = useState("none")
  const [allowedModels, setAllowedModels] = useState<string[]>([])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [choices, setChoices] = useState<CMSFieldOption[]>([])
  const [includeTime, setIncludeTime] = useState(true)
  const [enabledTools, setEnabledTools] = useState<string[]>(
    RICH_TEXT_TOOLS.map((t) => t.id)
  )

  const hasValidationSettings =
    type === "number" ||
    type === "text_single" ||
    type === "text_multi" ||
    type === "rich_text" ||
    type === "tags"

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const response = await fetch("/api/blocks")
        if (!response.ok) throw new Error("Failed to fetch blocks")
        const data = await response.json()
        setAvailableBlocks(data)
      } catch (err) {
        console.error("Error fetching blocks:", err)
      }
    }
    fetchBlocks()
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to move state updates out of the synchronous render cycle
      // resolving cascading render warnings from ESLint/Next.js
      const timer = setTimeout(() => {
        setModalStep(mode === "create" ? 1 : 2)

        if (field) {
          const s = field.settings || {}
          const isEdit = mode === "edit"

          setLabel(isEdit ? field.field_label : `${field.field_label} (copy)`)
          setSlug(isEdit ? field.slug : `${field.slug}_copy`)
          setType(field.field_type)
          setIsRequired(field.is_required)
          setIsUnique(field.is_unique)
          setSettings(s)
          setNote(field.field_note || "")
          setFieldsetId(field.fieldset_id || null)

          // Load advanced settings
          setPlaceholder((s.placeholder as string) || "")
          setHelpText((s.help_text as string) || "")
          setMin((s.min as number) ?? "")
          setMax((s.max as number) ?? "")
          setSettingStep((s.step as number) ?? "")
          setMinLength((s.min_length as number) ?? "")
          setMaxLength((s.max_length as number) ?? "")
          setMinItems((s.min_items as number) ?? "")
          setMaxItems((s.max_items as number) ?? "")

          const pattern = (s.regex_pattern as string) || ""
          setRegexPattern(pattern)
          if (pattern === "") {
            setRegexPreset("none")
          } else {
            const presetKey = Object.keys(REGEX_PATTERNS).find(
              (key) => REGEX_PATTERNS[key] === pattern
            )
            setRegexPreset(presetKey || "custom")
          }

          setAllowedModels((s.allowed_models as string[]) || [])
          setAllowMultiple(!!s.allow_multiple)
          setChoices((s.choices as CMSFieldOption[]) || [])
          setIncludeTime(s.include_time !== false)
          setEnabledTools(
            (s.enabled_tools as string[]) || RICH_TEXT_TOOLS.map((t) => t.id)
          )
        } else {
          // Reset for new field
          setLabel("")
          setSlug("")
          setType(FIELD_DEFINITIONS[0].type)
          setIsRequired(false)
          setIsUnique(false)
          setSettings({})
          setNote("")
          setFieldsetId(null)

          setPlaceholder("")
          setHelpText("")
          setMin("")
          setMax("")
          setSettingStep("")
          setMinLength("")
          setMaxLength("")
          setMinItems("")
          setMaxItems("")
          setRegexPattern("")
          setRegexPreset("none")
          setAllowedModels([])
          setAllowMultiple(false)
          setChoices([])
          setIncludeTime(true)
          setEnabledTools(RICH_TEXT_TOOLS.map((t) => t.id))
        }
        setError(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, field, mode])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    setIsSaving(true)
    setError(null)

    try {
      const isEdit = mode === "edit"
      const url = "/api/models/schema/fields"
      const method = isEdit ? "PATCH" : "POST"

      // Consolidate settings
      const finalSettings: Record<string, unknown> = {
        ...settings,
        placeholder: placeholder || undefined,
        help_text: helpText || undefined,
      }

      if (type === "number") {
        finalSettings.min = min !== "" ? Number(min) : undefined
        finalSettings.max = max !== "" ? Number(max) : undefined
        finalSettings.step =
          settingStep !== "" ? Number(settingStep) : undefined
      }

      if (
        ["text_single", "text_multi", "rich_text", "slug", "markdown"].includes(
          type
        )
      ) {
        finalSettings.min_length =
          minLength !== "" ? Number(minLength) : undefined
        finalSettings.max_length =
          maxLength !== "" ? Number(maxLength) : undefined
        finalSettings.regex_pattern = regexPattern || undefined
      }

      if (type === "tags") {
        finalSettings.min_items = minItems !== "" ? Number(minItems) : undefined
        finalSettings.max_items = maxItems !== "" ? Number(maxItems) : undefined
      }

      if (["reference", "navigation", "media"].includes(type)) {
        finalSettings.allowed_models = allowedModels
        finalSettings.allow_multiple = allowMultiple
      }

      if (type === "select") {
        finalSettings.choices = choices
      }

      if (type === "date_time") {
        finalSettings.include_time = includeTime
      }

      if (type === "rich_text") {
        finalSettings.enabled_tools = enabledTools
      }

      const body = isEdit
        ? {
            id: field?.id,
            field_label: label,
            field_note: note,
            is_required: isRequired,
            is_unique: isUnique,
            settings: finalSettings,
            fieldset_id: fieldsetId,
          }
        : {
            model_id: blockId ? null : modelId,
            block_id: blockId || null,
            slug: slug || label.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            field_label: label,
            field_note: note,
            field_type: type,
            is_required: isRequired,
            is_unique: isUnique,
            ui_order: field?.ui_order || 0,
            settings: finalSettings,
            fieldset_id: fieldsetId,
          }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${mode} field`)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} field`)
    } finally {
      setIsSaving(true) // Keep it true until modal closes to prevent double clicks
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  const title =
    mode === "edit"
      ? "Edit Field"
      : mode === "duplicate"
        ? "Duplicate Field"
        : "Add New Field"
  const description =
    mode === "edit"
      ? "Update the configuration for this field."
      : "Define the attributes for this field."

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      {error && <p className={s.errorText}>{error}</p>}

      {modalStep === 1 && (
        <div className={s.modalForm}>
          <div className={s.typeSelection}>
            <label className={s.fieldLabel}>Choose Field Type</label>
            <Tabs defaultValue="basic" className={s.typeTabs}>
              <Tabs.List className={s.tabsList}>
                <Tabs.Trigger value="basic" className={s.tabTrigger}>
                  <Type size={14} /> Basic
                </Tabs.Trigger>
                <Tabs.Trigger value="content" className={s.tabTrigger}>
                  <Layers size={14} /> Content
                </Tabs.Trigger>
                <Tabs.Trigger value="relational" className={s.tabTrigger}>
                  <ExternalLink size={14} /> Relational
                </Tabs.Trigger>
                <Tabs.Trigger value="advanced" className={s.tabTrigger}>
                  <Database size={14} /> Advanced
                </Tabs.Trigger>
              </Tabs.List>

              {(["basic", "content", "relational", "advanced"] as const).map(
                (cat) => (
                  <Tabs.Content key={cat} value={cat} className={s.tabsContent}>
                    <div className={s.typeGrid}>
                      {FIELD_DEFINITIONS.filter(
                        (def) => def.category === cat
                      ).map((def) => (
                        <button
                          key={def.type}
                          type="button"
                          className={clsx(
                            s.typeCard,
                            type === def.type && s.active
                          )}
                          onClick={() => {
                            setType(def.type)
                            setModalStep(2)
                          }}
                        >
                          <div className={s.typeCardIcon}>
                            <FileText size={20} />
                          </div>
                          <div className={s.typeCardInfo}>
                            <div className={s.typeCardLabel}>{def.label}</div>
                            <div className={s.typeCardDesc}>
                              {def.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Tabs.Content>
                )
              )}
            </Tabs>
          </div>

          <div className={s.modalActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {modalStep === 2 && (
        <form onSubmit={handleSubmit} className={s.modalForm}>
          <Tabs defaultValue="basic" className={s.tabsRoot}>
            <Tabs.List className={s.tabsList}>
              <Tabs.Trigger value="basic" className={s.tabTrigger}>
                <Settings size={14} /> Basic
              </Tabs.Trigger>
              {hasValidationSettings && (
                <Tabs.Trigger value="validation" className={s.tabTrigger}>
                  <ShieldCheck size={14} /> Validation
                </Tabs.Trigger>
              )}
              <Tabs.Trigger value="appearance" className={s.tabTrigger}>
                <Palette size={14} /> Appearance
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="basic" className={s.tabsContent}>
              <TextField
                label="Field Label"
                placeholder="e.g. Featured Image"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
                description="Human-friendly name for the field."
              />

              {mode !== "edit" && (
                <SlugField
                  label="Slug"
                  placeholder="e.g. featured_image"
                  value={slug}
                  onChange={setSlug}
                  sourceValue={label}
                  showUrlPrefix={false}
                  description="The physical column name in your database."
                />
              )}

              <TextField
                label="Field Note"
                placeholder="e.g. This image is used on the home page."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                description="Internal description or help text for editors."
              />

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

              <SelectField
                label="Field Grouping"
                description="Place this field inside a visual group (fieldset)."
                value={fieldsetId || "__none__"}
                onChange={(val) =>
                  setFieldsetId(val === "__none__" ? null : (val as string))
                }
                options={[
                  { label: "None (Ungrouped)", value: "__none__" },
                  ...fieldsets.map((fs) => ({
                    label: fs.label,
                    value: fs.id,
                  })),
                ]}
              />

              {["modular_content", "structured_text"].includes(type) && (
                <div className={s.blockSelection}>
                  <label className={s.fieldLabel}>Allowed Blocks</label>
                  <div className={s.blockGrid}>
                    {availableBlocks.map((block) => (
                      <button
                        key={block.id}
                        type="button"
                        className={clsx(
                          s.blockCard,
                          (settings.allowed_blocks as string[])?.includes(
                            block.id
                          ) && s.active
                        )}
                        onClick={() => {
                          const current =
                            (settings.allowed_blocks as string[]) || []
                          const next = current.includes(block.id)
                            ? current.filter((id) => id !== block.id)
                            : [...current, block.id]
                          setSettings((prev) => ({
                            ...prev,
                            allowed_blocks: next,
                          }))
                        }}
                      >
                        <span className={s.blockEmoji}>
                          {block.emoji || "📦"}
                        </span>
                        <span className={s.blockLabel}>{block.label}</span>
                      </button>
                    ))}
                  </div>
                  {availableBlocks.length === 0 && (
                    <p className={s.emptyText}>No blocks defined yet.</p>
                  )}
                </div>
              )}
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
                      value={settingStep}
                      onChange={(e) =>
                        setSettingStep(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      placeholder="e.g. 1 or 0.1"
                    />
                  </div>
                )}

                {[
                  "text_single",
                  "text_multi",
                  "rich_text",
                  "slug",
                  "markdown",
                ].includes(type) && (
                  <div className={s.settingsGrid}>
                    <TextField
                      label="Min Length"
                      type="number"
                      value={minLength}
                      onChange={(e) =>
                        setMinLength(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      placeholder="e.g. 0"
                    />
                    <TextField
                      label="Max Length"
                      type="number"
                      value={maxLength}
                      onChange={(e) =>
                        setMaxLength(
                          e.target.value ? Number(e.target.value) : ""
                        )
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
                        description="Enter your custom regular expression."
                      />
                    )}
                  </div>
                )}

                {type === "tags" && (
                  <div className={s.settingsGrid}>
                    <TextField
                      label="Min Tags"
                      type="number"
                      value={minItems}
                      onChange={(e) =>
                        setMinItems(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      placeholder="e.g. 1"
                    />
                    <TextField
                      label="Max Tags"
                      type="number"
                      value={maxItems}
                      onChange={(e) =>
                        setMaxItems(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      placeholder="e.g. 10"
                    />
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
                />
                <TextField
                  label="Help Text"
                  value={helpText}
                  onChange={(e) => setHelpText(e.target.value)}
                  placeholder="Instructional text for editors..."
                />
              </div>

              {type === "rich_text" && (
                <div className={s.advancedSettingsSection}>
                  <hr className={s.separator} />
                  <h4 className={s.settingsTitle}>Enabled Tools</h4>
                  <div className={s.checkboxGrid}>
                    {RICH_TEXT_TOOLS.map((tool) => (
                      <div key={tool.id}>
                        <CheckboxField
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {type === "select" && (
                <div className={s.advancedSettingsSection}>
                  <hr className={s.separator} />
                  <div className={s.sectionHeader}>
                    <h4 className={s.settingsTitle}>Dropdown Options</h4>
                    <Button
                      type="button"
                      unstyled
                      onClick={handleAddChoice}
                      className={s.addOptionButton}
                    >
                      <Plus size={14} /> Add Option
                    </Button>
                  </div>

                  <div className={s.optionsList}>
                    {choices.map((choice, index) => (
                      <div key={index} className={s.optionRow}>
                        <input
                          type="text"
                          className={s.optionInput}
                          placeholder="Label (e.g. Red)"
                          value={choice.label}
                          onChange={(e) =>
                            handleUpdateChoice(index, "label", e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className={s.optionInput}
                          placeholder="Value (e.g. red)"
                          value={choice.value}
                          onChange={(e) =>
                            handleUpdateChoice(index, "value", e.target.value)
                          }
                        />
                        <Button
                          type="button"
                          unstyled
                          onClick={() => handleRemoveChoice(index)}
                          className={s.removeOptionButton}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                    {choices.length === 0 && (
                      <p className={s.emptyText}>No options added yet.</p>
                    )}
                  </div>
                </div>
              )}

              {type === "reference" && (
                <div className={s.advancedSettingsSection}>
                  <hr className={s.separator} />
                  <h4 className={s.settingsTitle}>
                    Allowed models for reference
                  </h4>
                  <div className={s.checkboxGrid}>
                    {models.map((model) => (
                      <div key={model.id}>
                        <CheckboxField
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
                      </div>
                    ))}
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
                <div className={s.advancedSettingsSection}>
                  <hr className={s.separator} />
                  <h4 className={s.settingsTitle}>
                    Allowed models for navigation
                  </h4>
                  <div className={s.checkboxGrid}>
                    {models.map((model) => (
                      <div key={model.id}>
                        <CheckboxField
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {type === "media" && (
                <div className={s.advancedSettingsSection}>
                  <hr className={s.separator} />
                  <h4 className={s.settingsTitle}>Media Settings</h4>
                  <CheckboxField
                    label="Allow Multiple Assets"
                    checked={allowMultiple}
                    onChange={setAllowMultiple}
                    description="Allow uploading multiple files."
                    variant="switch"
                  />
                </div>
              )}

              {type === "date_time" && (
                <div className={s.advancedSettingsSection}>
                  <hr className={s.separator} />
                  <h4 className={s.settingsTitle}>Date Settings</h4>
                  <CheckboxField
                    label="Include Time"
                    checked={includeTime}
                    onChange={setIncludeTime}
                    description="Enable time selection."
                    variant="switch"
                  />
                </div>
              )}
            </Tabs.Content>
          </Tabs>

          <div className={s.modalActions}>
            {mode === "create" && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalStep(1)}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
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
      )}
    </Modal>
  )
}
