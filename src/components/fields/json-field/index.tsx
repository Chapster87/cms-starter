import React, { useState } from "react"
import TextAreaField from "../text-area-field"

interface JsonFieldProps {
  label: string
  description?: string
  fieldNote?: string
  required?: boolean
  id?: string
  name?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

/**
 * A specialized field for editing JSON data.
 * Extends TextAreaField with validation and monospace styling.
 */
export default function JsonField({
  label,
  description,
  fieldNote,
  required,
  id,
  name,
  value,
  onChange,
  disabled,
  className,
}: JsonFieldProps) {
  const [error, setError] = useState<string | undefined>()

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (!val && !required) {
      setError(undefined)
      return
    }

    try {
      JSON.parse(val)
      setError(undefined)
    } catch (_err) {
      setError("Invalid JSON format")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    onChange?.(val)
  }

  return (
    <TextAreaField
      label={label}
      description={description || "Must be a valid JSON object or array."}
      fieldNote={fieldNote}
      error={error}
      required={required}
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={className}
      monospace
      rows={8}
    />
  )
}
