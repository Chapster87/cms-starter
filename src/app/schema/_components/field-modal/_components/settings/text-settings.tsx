"use client"

import { TextField, SelectField } from "@/components/fields"
import s from "../../style.module.css"

const REGEX_PATTERNS: Record<string, string> = {
  email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  url: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,256}\\.[a-zA-Z0-9()]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
  numbers: "^[0-9]*$",
  alphanumeric: "^[a-zA-Z0-9]*$",
}

const REGEX_PRESETS = [
  { label: "None", value: "none" },
  { label: "Email", value: "email" },
  { label: "URL", value: "url" },
  { label: "Numbers Only", value: "numbers" },
  { label: "Alphanumeric", value: "alphanumeric" },
  { label: "Custom", value: "custom" },
]

interface TextSettingsProps {
  minLength: number | ""
  setMinLength: (val: number | "") => void
  maxLength: number | ""
  setMaxLength: (val: number | "") => void
  regexPattern: string
  setRegexPattern: (val: string) => void
  regexPreset: string
  setRegexPreset: (val: string) => void
}

export default function TextSettings({
  minLength,
  setMinLength,
  maxLength,
  setMaxLength,
  regexPattern,
  setRegexPattern,
  regexPreset,
  setRegexPreset,
}: TextSettingsProps) {
  return (
    <div className={s.settingsGrid}>
      <TextField
        label="Min Length"
        type="number"
        value={minLength}
        onChange={(e) =>
          setMinLength(e.target.value ? Number(e.target.value) : "")
        }
        placeholder="e.g. 0"
      />
      <TextField
        label="Max Length"
        type="number"
        value={maxLength}
        onChange={(e) =>
          setMaxLength(e.target.value ? Number(e.target.value) : "")
        }
        placeholder="e.g. 255"
      />
      <SelectField
        label="Regex Validation"
        value={regexPreset}
        onChange={(val) => {
          setRegexPreset(val)
          if (val === "none") {
            setRegexPattern("")
          } else if (val === "custom") {
            const isPreset =
              Object.values(REGEX_PATTERNS).includes(regexPattern)
            if (isPreset) setRegexPattern("")
          } else {
            setRegexPattern(REGEX_PATTERNS[val] || "")
          }
        }}
        options={REGEX_PRESETS}
        description="Choose a common pattern or create a custom one."
      />
      {regexPreset === "custom" && (
        <TextField
          label="Custom Regex Pattern"
          value={regexPattern}
          onChange={(e) => setRegexPattern(e.target.value)}
          placeholder="e.g. ^[a-z]+$"
          description="Enter your custom regular expression."
        />
      )}
    </div>
  )
}
