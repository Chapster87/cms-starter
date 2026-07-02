"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "@/client/toast-store"
import { useAuth } from "@/hooks/use-auth"
import { useModels } from "@/hooks/use-models"
import { CMSField, CMSFieldOption, CMSFieldSettings } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"

const REGEX_PATTERNS: Record<string, string> = {
  email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  url: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
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

interface UseFieldFormProps {
  mode: "create" | "edit" | "duplicate"
  fieldId?: string | null
  modelId: string
  blockId?: string | null
  onSuccess: () => void
}

/**
 * Hook for managing model field form state and logic.
 */
export function useFieldForm({
  mode,
  fieldId,
  modelId,
  blockId,
  onSuccess,
}: UseFieldFormProps) {
  const { accessToken } = useAuth()
  const { models: registeredModels } = useModels()
  const router = useRouter()
  const searchParams = useSearchParams()

  const fieldTypeFromUrl = searchParams.get("fieldType") as
    | CMSField["field_type"]
    | null

  const models = useMemo(
    () => [
      ...registeredModels,
      {
        id: "users",
        table_name: "users",
        friendly_name: "CMS Users",
        slug: "users",
      },
    ],
    [registeredModels]
  )

  // Form State
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

  // Field Specific Settings
  const [allowedModels, setAllowedModels] = useState<string[]>([])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [choices, setChoices] = useState<CMSFieldOption[]>([])
  const [includeTime, setIncludeTime] = useState(true)
  const [enabledTools, setEnabledTools] = useState<string[]>(
    RICH_TEXT_TOOLS.map((t) => t.id)
  )

  // Validation & Appearance Settings
  const [placeholder, setPlaceholder] = useState("")
  const [helpText, setHelpText] = useState("")
  const [min, setMin] = useState<number | "">("")
  const [max, setMax] = useState<number | "">("")
  const [step, setStep] = useState<number | "">("")
  const [minLength, setMinLength] = useState<number | "">("")
  const [maxLength, setMaxLength] = useState<number | "">("")
  const [minItems, setMinItems] = useState<number | "">("")
  const [maxItems, setMaxItems] = useState<number | "">("")
  const [regexPattern, setRegexPattern] = useState("")
  const [regexPreset, setRegexPreset] = useState("none")

  const hasValidationSettings = useMemo(
    () =>
      type === "number" ||
      type === "text_single" ||
      type === "text_multi" ||
      type === "rich_text" ||
      type === "tags",
    [type]
  )

  // Fetch field data
  useEffect(() => {
    const fetchFieldData = async () => {
      if (!accessToken || (!modelId && !blockId)) return

      try {
        const url = blockId
          ? `/api/blocks/fields?blockId=${blockId}`
          : `/api/models/schema/fields?model_id=${modelId}`

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!response.ok) throw new Error("Failed to fetch field data")

        const data = (await response.json()) as CMSField[]
        setExistingFields(data)

        if (mode === "create" || !fieldId) return

        const field = data.find((f: CMSField) => f.id === fieldId)
        if (field) {
          const settings = (field.settings || {}) as Record<string, unknown>
          const fieldChoices = (settings.choices as CMSFieldOption[]) || []

          if (mode === "edit" || mode === "duplicate") {
            const isEdit = mode === "edit"
            setLabel(isEdit ? field.field_label : `${field.field_label} (copy)`)
            setName(isEdit ? field.slug : `${field.slug}_copy`)
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

            setPlaceholder((settings.placeholder as string) || "")
            setHelpText((settings.help_text as string) || "")
            setMin((settings.min as number) ?? "")
            setMax((settings.max as number) ?? "")
            setStep((settings.step as number) ?? "")
            setMinLength((settings.min_length as number) ?? "")
            setMaxLength((settings.max_length as number) ?? "")
            setMinItems((settings.min_items as number) ?? "")
            setMaxItems((settings.max_items as number) ?? "")

            const pattern = (settings.regex_pattern as string) || ""
            setRegexPattern(pattern)
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
        console.error("Error fetching field for hook:", err)
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
        fetchFieldData()
      } else {
        fetchFieldData()
      }
      setError(null)
    }, 0)
    return () => clearTimeout(timer)
  }, [mode, fieldId, accessToken, modelId, blockId, fieldTypeFromUrl])

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

      if (type === "tags") {
        settings.min_items = minItems !== "" ? Number(minItems) : undefined
        settings.max_items = maxItems !== "" ? Number(maxItems) : undefined
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
            model_id: blockId ? null : modelId,
            block_id: blockId || null,
            slug: name || label.toLowerCase().replace(/[^a-z0-9]/g, "_"),
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

  return {
    // State
    label,
    setLabel,
    name,
    setName,
    type,
    setType,
    isRequired,
    setIsRequired,
    isUnique,
    setIsUnique,
    note,
    setNote,
    isSaving,
    error,
    isIdTouched,
    setIsIdTouched,
    hasValidationSettings,
    models,

    // Field Settings
    allowedModels,
    setAllowedModels,
    allowMultiple,
    setAllowMultiple,
    choices,
    setChoices,
    includeTime,
    setIncludeTime,
    enabledTools,
    setEnabledTools,

    // Detailed Settings
    placeholder,
    setPlaceholder,
    helpText,
    setHelpText,
    min,
    setMin,
    max,
    setMax,
    step,
    setStep,
    minLength,
    setMinLength,
    maxLength,
    setMaxLength,
    minItems,
    setMinItems,
    maxItems,
    setMaxItems,
    regexPattern,
    setRegexPattern,
    regexPreset,
    setRegexPreset,

    // Constants
    REGEX_PATTERNS,

    // Handlers
    handleBack,
    handleSubmit,
    handleAddChoice,
    handleRemoveChoice,
    handleUpdateChoice,
  }
}

export type FieldFormHook = ReturnType<typeof useFieldForm>
