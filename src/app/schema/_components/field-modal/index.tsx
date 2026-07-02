"use client"

import { useState, useEffect } from "react"

import Button from "@/components/button"
import Modal from "@/components/modal"
import { useModels } from "@/hooks/use-models"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { CMSField, CMSFieldset, CMSBlock, CMSFieldOption } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"
import FieldConfiguration from "./_components/field-configuration"
import StepTypeSelector from "./_components/step-type-selector"

import s from "./style.module.css"

const REGEX_PATTERNS: Record<string, string> = {
  email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  url: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,256}\\.[a-zA-Z0-9()]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
  numbers: "^[0-9]*$",
  alphanumeric: "^[a-zA-Z0-9]*$",
}

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
  const { settings: siteSettings } = useSiteSettings()
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
  const [urlPrefix, setUrlPrefix] = useState("")

  const hasValidationSettings =
    type === "number" ||
    type === "text_single" ||
    type === "text_multi" ||
    type === "rich_text" ||
    type === "seo_slug" ||
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
          setUrlPrefix((s.url_prefix as string) || "")

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
          setUrlPrefix(`${siteSettings?.siteUrl}/` || "")
        }
        setError(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, field, mode, siteSettings?.siteUrl])

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
        [
          "text_single",
          "text_multi",
          "rich_text",
          "seo_slug",
          "markdown",
        ].includes(type)
      ) {
        finalSettings.min_length =
          minLength !== "" ? Number(minLength) : undefined
        finalSettings.max_length =
          maxLength !== "" ? Number(maxLength) : undefined
        finalSettings.regex_pattern = regexPattern || undefined
      }

      if (type === "seo_slug") {
        finalSettings.url_prefix = urlPrefix || undefined
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
          <StepTypeSelector
            selectedType={type}
            onSelect={(newType) => {
              setType(newType)
              setModalStep(2)
            }}
          />

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
          <FieldConfiguration
            mode={mode}
            type={type}
            label={label}
            setLabel={setLabel}
            slug={slug}
            setSlug={setSlug}
            note={note}
            setNote={setNote}
            isRequired={isRequired}
            setIsRequired={setIsRequired}
            isUnique={isUnique}
            setIsUnique={setIsUnique}
            fieldsetId={fieldsetId}
            setFieldsetId={setFieldsetId}
            fieldsets={fieldsets}
            hasValidationSettings={hasValidationSettings}
            min={min}
            setMin={setMin}
            max={max}
            setMax={setMax}
            step={settingStep}
            setStep={setSettingStep}
            minLength={minLength}
            setMinLength={setMinLength}
            maxLength={maxLength}
            setMaxLength={setMaxLength}
            regexPattern={regexPattern}
            setRegexPattern={setRegexPattern}
            regexPreset={regexPreset}
            setRegexPreset={setRegexPreset}
            models={models}
            allowedModels={allowedModels}
            setAllowedModels={setAllowedModels}
            allowMultiple={allowMultiple}
            setAllowMultiple={setAllowMultiple}
            choices={choices}
            setChoices={setChoices}
            includeTime={includeTime}
            setIncludeTime={setIncludeTime}
            enabledTools={enabledTools}
            setEnabledTools={setEnabledTools}
            availableBlocks={availableBlocks}
            allowedBlocks={(settings.allowed_blocks as string[]) || []}
            setAllowedBlocks={(next) =>
              setSettings((prev) => ({ ...prev, allowed_blocks: next }))
            }
            placeholder={placeholder}
            setPlaceholder={setPlaceholder}
            helpText={helpText}
            setHelpText={setHelpText}
            urlPrefix={urlPrefix}
            setUrlPrefix={setUrlPrefix}
          />

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
