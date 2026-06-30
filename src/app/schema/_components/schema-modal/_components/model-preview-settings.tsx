"use client"

import { CheckboxField, SelectField } from "@/components/fields"
import s from "../style.module.css"

interface ModelPreviewSettingsProps {
  availableFields: Array<{ slug: string; field_label: string }>
  previewColumns: string[]
  setPreviewColumns: (cols: string[] | ((prev: string[]) => string[])) => void
  subtitleColumn: string | null
  setSubtitleColumn: (val: string | null) => void
  isSaving: boolean
}

export default function ModelPreviewSettings({
  availableFields,
  previewColumns,
  setPreviewColumns,
  subtitleColumn,
  setSubtitleColumn,
  isSaving,
}: ModelPreviewSettingsProps) {
  const togglePreviewColumn = (fieldName: string) => {
    setPreviewColumns((prev) =>
      prev.includes(fieldName)
        ? prev.filter((f) => f !== fieldName)
        : [...prev, fieldName]
    )
  }

  return (
    <>
      <div className={s.fieldSection}>
        <label className={s.fieldLabel}>Preview Columns</label>
        <div className={s.previewColumnsGrid}>
          {availableFields
            .filter(
              (f) =>
                ![
                  "id",
                  "created_at",
                  "updated_at",
                  "status",
                  "_draft",
                ].includes(f.slug)
            )
            .map((field) => (
              <div key={field.slug} className={s.previewColumnCheck}>
                <CheckboxField
                  label={`${field.field_label}`}
                  checked={previewColumns.includes(field.slug)}
                  onChange={() => togglePreviewColumn(field.slug)}
                  disabled={isSaving}
                />
              </div>
            ))}
        </div>
        <p className={s.fieldDescription}>
          Pick fields to show on the top line of reference selection modals.
        </p>
      </div>

      <div className={s.fieldSection}>
        <SelectField
          label="Subtitle Column"
          value={subtitleColumn || "none"}
          onChange={(val) => setSubtitleColumn(val === "none" ? null : val)}
          disabled={isSaving}
          options={[
            { label: "(None)", value: "none" },
            ...availableFields
              .filter(
                (f) =>
                  ![
                    "id",
                    "created_at",
                    "updated_at",
                    "status",
                    "_draft",
                  ].includes(f.slug)
              )
              .map((field) => ({
                label: `${field.field_label}`,
                value: field.slug,
              })),
          ]}
          description="Pick a field to show as a second line (subtitle) in selection modals."
        />
      </div>
    </>
  )
}
