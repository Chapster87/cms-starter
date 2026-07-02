"use client"

import React from "react"
import { TextField, SelectField } from "@/components/fields"
import { FieldFormHook } from "../../_hooks/use-field-form"
import s from "../../style.module.css"

const REGEX_PRESETS = [
  { label: "None", value: "none" },
  { label: "Email", value: "email" },
  { label: "URL", value: "url" },
  { label: "Numbers Only", value: "numbers" },
  { label: "Alphanumeric", value: "alphanumeric" },
  { label: "Custom", value: "custom" },
]

interface ValidationSettingsProps {
  form: FieldFormHook
}

/**
 * Validation settings tab for the field modal.
 * Handles type-specific validation rules.
 */
export default function ValidationSettings({ form }: ValidationSettingsProps) {
  const { type } = form

  return (
    <div className={s.tabsContent}>
      {type === "number" && (
        <div className={s.settingsGrid}>
          <TextField
            label="Minimum Value"
            type="number"
            value={form.min}
            onChange={(e) =>
              form.setMin(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="No min"
          />
          <TextField
            label="Maximum Value"
            type="number"
            value={form.max}
            onChange={(e) =>
              form.setMax(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="No max"
          />
          <TextField
            label="Step"
            type="number"
            value={form.step}
            onChange={(e) =>
              form.setStep(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="e.g. 1 or 0.1"
            className={s.fullWidth}
          />
        </div>
      )}

      {(type === "text_single" ||
        type === "text_multi" ||
        type === "rich_text") && (
        <div className={s.settingsGrid}>
          <TextField
            label="Min Length"
            type="number"
            value={form.minLength}
            onChange={(e) =>
              form.setMinLength(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="e.g. 0"
          />
          <TextField
            label="Max Length"
            type="number"
            value={form.maxLength}
            onChange={(e) =>
              form.setMaxLength(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="e.g. 255"
          />
          <SelectField
            label="Regex Validation"
            value={form.regexPreset}
            onChange={(val) => {
              form.setRegexPreset(val)
              if (val === "none") {
                form.setRegexPattern("")
              } else if (val === "custom") {
                const isPreset = Object.values(form.REGEX_PATTERNS).includes(
                  form.regexPattern
                )
                if (isPreset) form.setRegexPattern("")
              } else {
                form.setRegexPattern(form.REGEX_PATTERNS[val] || "")
              }
            }}
            options={REGEX_PRESETS}
            description="Choose a common pattern or create a custom one."
          />
          {form.regexPreset === "custom" && (
            <TextField
              label="Custom Regex Pattern"
              value={form.regexPattern}
              onChange={(e) => form.setRegexPattern(e.target.value)}
              placeholder="e.g. ^[a-z]+$"
              className={s.fullWidth}
              description="Enter your custom regular expression."
            />
          )}
        </div>
      )}

      {type === "tags" && (
        <div className={s.settingsGrid}>
          <TextField
            label="Min Tags"
            type="number"
            value={form.minItems}
            onChange={(e) =>
              form.setMinItems(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="e.g. 1"
          />
          <TextField
            label="Max Tags"
            type="number"
            value={form.maxItems}
            onChange={(e) =>
              form.setMaxItems(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="e.g. 10"
          />
        </div>
      )}
    </div>
  )
}
