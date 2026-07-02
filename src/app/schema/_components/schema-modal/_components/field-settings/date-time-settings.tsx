"use client"

import React from "react"
import { CheckboxField } from "@/components/fields"
import { FieldFormHook } from "../../_hooks/use-field-form"
import s from "../../style.module.css"

interface DateTimeSettingsProps {
  form: FieldFormHook
}

export default function DateTimeSettings({ form }: DateTimeSettingsProps) {
  return (
    <div className={s.referenceSettings}>
      <hr className={s.separator} />
      <h4 className={s.settingsTitle}>Date Settings</h4>
      <CheckboxField
        label="Include Time"
        checked={form.includeTime}
        onChange={form.setIncludeTime}
        description="Enable time selection alongside the date."
        variant="switch"
      />
    </div>
  )
}
