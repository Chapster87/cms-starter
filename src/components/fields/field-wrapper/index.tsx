import React from "react"
import * as Label from "@radix-ui/react-label"
import { clsx } from "clsx"
import s from "./style.module.css"

interface FieldWrapperProps {
  id: string
  label: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  variant?: "default" | "checkbox"
}

/**
 * A standard wrapper for form fields that provides a label, description, and error messaging.
 * Leverages Radix UI's Label primitive for accessibility.
 */
export default function FieldWrapper({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
  variant = "default",
}: FieldWrapperProps) {
  return (
    <div className={clsx(s.wrapper, s[variant], className)}>
      <div className={s.labelRow}>
        <Label.Root className={s.label} htmlFor={id}>
          {label}
          {required && <span className={s.required}>*</span>}
        </Label.Root>
      </div>

      {children}

      {description && <div className={s.description}>{description}</div>}
      {error && <div className={s.error}>{error}</div>}
    </div>
  )
}
