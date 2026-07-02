"use client"

import React from "react"
import { CheckboxField } from "@/components/fields"
import { FieldFormHook } from "../../_hooks/use-field-form"
import s from "../../style.module.css"

interface ReferenceSettingsProps {
  form: FieldFormHook
}

export default function ReferenceSettings({ form }: ReferenceSettingsProps) {
  return (
    <div className={s.referenceSettings}>
      <hr className={s.separator} />
      <h4 className={s.settingsTitle}>Linked Record Settings</h4>

      <div className={s.modelsGrid}>
        <label className={s.fieldLabel}>Allow selection from:</label>
        <div className={s.checkboxGroup}>
          {form.models.map((model) => (
            <CheckboxField
              key={model.id}
              label={model.friendly_name}
              checked={form.allowedModels.includes(model.id)}
              onChange={(checked) => {
                if (checked) {
                  form.setAllowedModels([...form.allowedModels, model.id])
                } else {
                  form.setAllowedModels(
                    form.allowedModels.filter((id) => id !== model.id)
                  )
                }
              }}
            />
          ))}
        </div>
      </div>

      <CheckboxField
        label="Allow Multiple Selection"
        checked={form.allowMultiple}
        onChange={form.setAllowMultiple}
        description="Allow editors to select more than one record."
        variant="switch"
      />
    </div>
  )
}
