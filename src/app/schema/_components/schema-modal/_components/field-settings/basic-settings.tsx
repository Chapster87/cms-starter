"use client"

import React from "react"
import {
  TextField,
  SelectField,
  CheckboxField,
  SlugField,
} from "@/components/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"
import { CMSField } from "@/types/fields"
import { FieldFormHook } from "../../_hooks/use-field-form"
import s from "../../style.module.css"

interface BasicSettingsProps {
  form: FieldFormHook
  mode: "create" | "edit" | "duplicate"
  fieldId?: string | null
  fieldTypeFromUrl?: CMSField["field_type"] | null
}

/**
 * Basic settings tab for the field modal.
 * Handles identification, name, type, and core constraints.
 */
export default function BasicSettings({
  form,
  mode,
  fieldId,
  fieldTypeFromUrl,
}: BasicSettingsProps) {
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setLabel(e.target.value)
  }

  return (
    <div className={s.tabsContent}>
      {mode === "edit" && (
        <>
          <TextField
            label="Field ID (UUID)"
            value={fieldId || ""}
            disabled
            description="The unique database identifier for this field."
          />
          <TextField
            label="Slug"
            value={form.name}
            disabled
            description="The physical column name in your database."
          />
        </>
      )}

      <TextField
        label="Field Label"
        placeholder="e.g. Featured Image"
        value={form.label}
        onChange={handleLabelChange}
        required
        description="Human-friendly name for the field."
      />

      {mode !== "edit" && (
        <>
          <SlugField
            label="Slug"
            placeholder="e.g. featured_image"
            value={form.name}
            sourceValue={form.label}
            onChange={form.setName}
            separator="_"
            showUrlPrefix={false}
            isTouched={form.isIdTouched}
            onToggleTouched={form.setIsIdTouched}
            description="The physical column name in your database."
          />

          {!fieldTypeFromUrl && (
            <SelectField
              label="Field Type"
              value={form.type}
              onChange={(val) => form.setType(val as CMSField["field_type"])}
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
          value={form.note}
          onChange={(e) => form.setNote(e.target.value)}
          description="Internal description or help text for editors."
        />
      )}

      <div className={s.settingsGrid}>
        <CheckboxField
          label="Required Field"
          checked={form.isRequired}
          onChange={form.setIsRequired}
          description="Make mandatory."
          variant="switch"
        />

        <CheckboxField
          label="Unique Constraint"
          checked={form.isUnique}
          onChange={form.setIsUnique}
          description="Prevent duplicates."
          variant="switch"
        />
      </div>
    </div>
  )
}
