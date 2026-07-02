"use client"

import React from "react"
import { TextField } from "@/components/fields"
import { FieldFormHook } from "../../_hooks/use-field-form"
import FieldSpecificRegistry from "./field-specific-registry"
import s from "../../style.module.css"

interface AppearanceSettingsProps {
  form: FieldFormHook
}

/**
 * Appearance settings tab for the field modal.
 * Handles placeholder, help text, and delegates field-specific config.
 */
export default function AppearanceSettings({ form }: AppearanceSettingsProps) {
  return (
    <div className={s.tabsContent}>
      <div className={s.settingsGrid}>
        <TextField
          label="Placeholder Text"
          value={form.placeholder}
          onChange={(e) => form.setPlaceholder(e.target.value)}
          placeholder="Enter placeholder..."
          className={s.fullWidth}
        />
        <TextField
          label="Help Text"
          value={form.helpText}
          onChange={(e) => form.setHelpText(e.target.value)}
          placeholder="Instructional text for editors..."
          className={s.fullWidth}
        />
      </div>

      <FieldSpecificRegistry form={form} />
    </div>
  )
}
