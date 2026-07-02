"use client"

import React from "react"
import { CheckboxField } from "@/components/fields"
import { FieldFormHook } from "../../_hooks/use-field-form"
import s from "../../style.module.css"

interface MediaSettingsProps {
  form: FieldFormHook
}

export default function MediaSettings({ form }: MediaSettingsProps) {
  return (
    <div className={s.referenceSettings}>
      <hr className={s.separator} />
      <h4 className={s.settingsTitle}>Media Asset Settings</h4>
      <CheckboxField
        label="Multiple Assets"
        checked={form.allowMultiple}
        onChange={form.setAllowMultiple}
        description="Allow editors to upload more than one image or file."
        variant="switch"
      />
    </div>
  )
}
