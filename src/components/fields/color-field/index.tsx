"use client"

import React from "react"
import FieldWrapper from "../field-wrapper"
import s from "./style.module.css"

interface ColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
  name?: string
}

/**
 * A specialized field for selecting colors.
 * Uses the native browser color picker.
 */
export default function ColorField({
  label,
  value,
  onChange,
  description,
  fieldNote,
  required,
  disabled,
  name,
}: ColorFieldProps) {
  const id = React.useId()

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <div className={s.colorInputWrapper}>
        <input
          id={id}
          type="color"
          name={name}
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={s.colorInput}
        />
        <input
          type="text"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={s.colorText}
          placeholder="#000000"
        />
      </div>
    </FieldWrapper>
  )
}
