import React from "react"
import * as Checkbox from "@radix-ui/react-checkbox"
import * as Switch from "@radix-ui/react-switch"
import { Check } from "lucide-react"
import FieldWrapper from "../field-wrapper"
import s from "./style.module.css"

interface CheckboxFieldProps {
  label: string
  description?: string
  fieldNote?: string
  error?: string
  required?: boolean
  id?: string
  name?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  variant?: "checkbox" | "switch"
}

/**
 * A boolean input field supporting both standard checkbox and toggle switch variants.
 * Uses Radix UI primitives for accessibility.
 */
export default function CheckboxField({
  label,
  description,
  fieldNote,
  error,
  required,
  id,
  name,
  checked,
  onChange,
  disabled,
  variant = "checkbox",
}: CheckboxFieldProps) {
  const inputId = id || `checkbox-field-${name}`

  return (
    <FieldWrapper
      id={inputId}
      label={label}
      description={description}
      fieldNote={fieldNote}
      error={error}
      required={required}
      variant="checkbox"
    >
      {variant === "switch" ? (
        <Switch.Root
          id={inputId}
          className={s.switchRoot}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          name={name}
        >
          <Switch.Thumb className={s.switchThumb} />
        </Switch.Root>
      ) : (
        <Checkbox.Root
          id={inputId}
          className={s.checkboxRoot}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          name={name}
        >
          <Checkbox.Indicator className={s.checkboxIndicator}>
            <Check size={14} strokeWidth={3} />
          </Checkbox.Indicator>
        </Checkbox.Root>
      )}
    </FieldWrapper>
  )
}
