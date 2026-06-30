"use client"

import { CheckboxField } from "@/components/fields"
import s from "../../style.module.css"

interface RelationSettingsProps {
  type: string
  models: Array<{ id: string; friendly_name: string }>
  allowedModels: string[]
  setAllowedModels: (ids: string[]) => void
  allowMultiple: boolean
  setAllowMultiple: (val: boolean) => void
}

export default function RelationSettings({
  type,
  models,
  allowedModels,
  setAllowedModels,
  allowMultiple,
  setAllowMultiple,
}: RelationSettingsProps) {
  const isNavigation = type === "navigation"
  const isMedia = type === "media"

  if (isMedia) {
    return (
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
    )
  }

  return (
    <div className={s.advancedSettingsSection}>
      <hr className={s.separator} />
      <h4 className={s.settingsTitle}>
        Allowed models for {isNavigation ? "navigation" : "reference"}
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
      {!isNavigation && (
        <CheckboxField
          label="Allow Multiple Selection"
          checked={allowMultiple}
          onChange={setAllowMultiple}
          description="Allow editors to select more than one record."
          variant="switch"
        />
      )}
    </div>
  )
}
