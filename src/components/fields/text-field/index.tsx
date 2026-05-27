import React from "react"
import { clsx } from "clsx"
import FieldWrapper from "../field-wrapper"
import s from "./style.module.css"

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
  required?: boolean
}

/**
 * A standard text input field wrapped with consistent labeling and messaging.
 */
export default function TextField({
  label,
  description,
  error,
  required,
  id,
  className,
  ...props
}: TextFieldProps) {
  const inputId = id || `text-field-${props.name}`

  return (
    <FieldWrapper
      id={inputId}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <input
        {...props}
        id={inputId}
        className={clsx(s.input, error && s.error)}
        required={required}
      />
    </FieldWrapper>
  )
}
