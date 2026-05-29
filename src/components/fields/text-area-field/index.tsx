import React from "react"
import { clsx } from "clsx"
import FieldWrapper from "../field-wrapper"
import s from "./style.module.css"

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  description?: string
  fieldNote?: string
  error?: string
  required?: boolean
  monospace?: boolean
}

/**
 * A standard textarea field wrapped with consistent labeling and messaging.
 * Optionally supports monospace font for JSON or code content.
 */
export default function TextAreaField({
  label,
  description,
  fieldNote,
  error,
  required,
  id,
  className,
  monospace,
  ...props
}: TextAreaFieldProps) {
  const inputId = id || `textarea-field-${props.name}`

  return (
    <FieldWrapper
      id={inputId}
      label={label}
      description={description}
      fieldNote={fieldNote}
      error={error}
      required={required}
      className={className}
    >
      <textarea
        {...props}
        id={inputId}
        className={clsx(s.textarea, error && s.error, monospace && s.monospace)}
        required={required}
      />
    </FieldWrapper>
  )
}
