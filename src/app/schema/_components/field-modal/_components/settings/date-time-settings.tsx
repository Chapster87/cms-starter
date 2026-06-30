"use client"

import { CheckboxField } from "@/components/fields"
import s from "../../style.module.css"

interface DateTimeSettingsProps {
  includeTime: boolean
  setIncludeTime: (val: boolean) => void
}

export default function DateTimeSettings({
  includeTime,
  setIncludeTime,
}: DateTimeSettingsProps) {
  return (
    <div className={s.advancedSettingsSection}>
      <hr className={s.separator} />
      <h4 className={s.settingsTitle}>Date Settings</h4>
      <CheckboxField
        label="Include Time"
        checked={includeTime}
        onChange={setIncludeTime}
        description="Enable time selection."
        variant="switch"
      />
    </div>
  )
}
