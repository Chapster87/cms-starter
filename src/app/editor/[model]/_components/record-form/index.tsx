"use client"

import { useMemo, useCallback } from "react"
import { RefreshCw, ChevronDown, AlertCircle } from "lucide-react"
import * as Accordion from "@radix-ui/react-accordion"
import Button from "@/components/button"
import { CMSField, CMSFieldset } from "@/types/fields"
import { CMSModelMap, CMSModelName } from "@/types/cms-generated"
import { FieldRegistry } from "./field-registry"
import { useFormStateEngine } from "./hooks/use-form-state-engine"
import { useLocalStorageSafetyNet } from "./hooks/use-local-storage-safety-net"
import s from "./style.module.css"

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
 * Delegating state and business logic to the FormStateEngine.
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
  const { formState, schema, fieldsets, fetchingSchema, actions } =
    useFormStateEngine({
      id,
      model,
      initialData,
      onAutoSave,
    })

  const { hasRestorableData, restore, discard, clear } =
    useLocalStorageSafetyNet({
      id,
      model,
      currentValues: formState.values,
      onRestore: (data) => actions.reset(data),
    })

  /**
   * Internal helper for accessing form data dynamically.
   */
  const getFieldValue = useCallback(
    (key: string): unknown => {
      return formState.values[key]
    },
    [formState.values]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const isValid = await actions.validate()
      if (isValid) {
        const submissionData = actions.getSubmissionData()
        onSubmit(submissionData as Partial<CMSModelMap[T]>)
      }
    },
    [actions, onSubmit]
  )

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
          error={formState.errors[field.slug]}
          disabled={isLoading || !!field.is_computed}
          onChange={(val: unknown) => actions.setValue(field.slug, val)}
          getFieldValue={getFieldValue}
          schema={schema}
        />
      )
    },
    [formState.errors, actions, getFieldValue, isLoading, schema]
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

  const onFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e)
    // If it's a new record, we clear local storage on success.
    // The parent handles redirection, but we can clear here.
    if (!id) {
      clear()
    }
  }

  return (
    <form id={id} onSubmit={onFormSubmit} className={s.form}>
      {hasRestorableData && (
        <div className={s.safetyNetAlert}>
          <div className={s.safetyNetContent}>
            <AlertCircle size={20} />
            <div>
              <strong>Unsaved work found.</strong>
              <p>Would you like to restore your last session?</p>
            </div>
          </div>
          <div className={s.safetyNetActions}>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={restore}
            >
              Restore
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={discard}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {(model as string) === "authors" && !!getFieldValue("user_id") && (
        <div style={{ marginBottom: "8px" }}>
          <Button
            type="button"
            variant="secondary"
            size="small"
            beforeText={<RefreshCw size={14} />}
            onClick={() => actions.syncFromUser()}
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
