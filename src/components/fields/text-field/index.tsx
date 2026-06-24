import React from "react"
import { clsx } from "clsx"
import FieldWrapper from "../field-wrapper"
import s from "./style.module.css"

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  fieldNote?: string
  error?: string
  required?: boolean
  leftElement?: React.ReactNode
}

/**
 * A standard text input field wrapped with consistent labeling and messaging.
 */
export default function TextField({
  label,
  description,
  fieldNote,
  error,
  required,
  id,
  className,
  leftElement,
  ...props
}: TextFieldProps) {
  const inputId = id || `text-field-${props.name}`

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
      <div className={clsx(s.inputContainer, error && s.error)}>
        {leftElement && <div className={s.leftElement}>{leftElement}</div>}
        <input
          {...props}
          id={inputId}
          className={s.input}
          required={required}
        />
      </div>
    </FieldWrapper>
  )
}
