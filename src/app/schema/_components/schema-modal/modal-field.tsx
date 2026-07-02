"use client"

import { useSearchParams } from "next/navigation"
import { Settings, ShieldCheck, Palette } from "lucide-react"
import * as Tabs from "@radix-ui/react-tabs"
import Button from "@/components/button"
import { CMSField } from "@/types/fields"
import AppearanceSettings from "./_components/field-settings/appearance-settings"
import BasicSettings from "./_components/field-settings/basic-settings"
import ValidationSettings from "./_components/field-settings/validation-settings"
import { useFieldForm } from "./_hooks/use-field-form"
import s from "./style.module.css"

interface ModalFieldProps {
  mode: "create" | "edit" | "duplicate"
  fieldId?: string | null
  modelId: string
  blockId?: string | null
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Form component for creating, editing, or duplicating a model field.
 * Refactored to use modular sub-components and a custom logic hook.
 */
export default function ModalField({
  mode,
  fieldId,
  modelId,
  blockId,
  onSuccess,
  onCancel,
}: ModalFieldProps) {
  const searchParams = useSearchParams()
  const fieldTypeFromUrl = searchParams.get("fieldType") as
    | CMSField["field_type"]
    | null

  const form = useFieldForm({
    mode,
    fieldId,
    modelId,
    blockId,
    onSuccess,
  })

  return (
    <form onSubmit={form.handleSubmit} className={s.modalForm}>
      {mode === "create" && (
        <div className={s.modalNav}>
          <Button
            type="button"
            unstyled
            className={s.backButton}
            onClick={form.handleBack}
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

      {form.error && <p className={s.errorText}>{form.error}</p>}

      <Tabs.Root defaultValue="basic" className={s.tabsRoot}>
        <Tabs.List className={s.tabsList}>
          <Tabs.Trigger value="basic" className={s.tabsTrigger}>
            <Settings size={14} style={{ marginRight: "8px" }} /> Basic
          </Tabs.Trigger>
          {form.hasValidationSettings && (
            <Tabs.Trigger value="validation" className={s.tabsTrigger}>
              <ShieldCheck size={14} style={{ marginRight: "8px" }} />{" "}
              Validation
            </Tabs.Trigger>
          )}
          <Tabs.Trigger value="appearance" className={s.tabsTrigger}>
            <Palette size={14} style={{ marginRight: "8px" }} /> Appearance
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="basic">
          <BasicSettings
            form={form}
            mode={mode}
            fieldId={fieldId}
            fieldTypeFromUrl={fieldTypeFromUrl}
          />
        </Tabs.Content>

        {form.hasValidationSettings && (
          <Tabs.Content value="validation">
            <ValidationSettings form={form} />
          </Tabs.Content>
        )}

        <Tabs.Content value="appearance">
          <AppearanceSettings form={form} />
        </Tabs.Content>
      </Tabs.Root>

      <div className={s.modalActions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={form.isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={form.isSaving}
          disabled={form.isSaving}
        >
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
