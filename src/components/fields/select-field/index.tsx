import React from "react"
import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { clsx } from "clsx"
import FieldWrapper from "../field-wrapper"
import s from "./style.module.css"

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: string
  description?: string
  error?: string
  required?: boolean
  id?: string
  name?: string
  value?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * A styled dropdown select field using Radix UI primitives.
 */
export default function SelectField({
  label,
  description,
  error,
  required,
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled,
  className,
}: SelectFieldProps) {
  const inputId = id || `select-field-${name}`

  return (
    <FieldWrapper
      id={inputId}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Select.Root
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        name={name}
        required={required}
      >
        <Select.Trigger
          className={clsx(s.trigger, error && s.error)}
          id={inputId}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon className={s.triggerIcon}>
            <ChevronDown size={16} />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className={s.content}
            position="popper"
            sideOffset={4}
          >
            <Select.ScrollUpButton className={s.scrollButton}>
              <ChevronUp size={16} />
            </Select.ScrollUpButton>

            <Select.Viewport className={s.viewport}>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={s.item}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className={s.itemIndicator}>
                    <Check size={14} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>

            <Select.ScrollDownButton className={s.scrollButton}>
              <ChevronDown size={16} />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </FieldWrapper>
  )
}
