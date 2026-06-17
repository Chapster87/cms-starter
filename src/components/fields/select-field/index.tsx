"use client"

import React from "react"
import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { clsx } from "clsx"

import { CMSField, CMSFieldOption } from "@/types/fields"
import FieldWrapper from "../field-wrapper"

import s from "./style.module.css"

interface SelectFieldProps {
  field?: CMSField
  label?: string
  description?: string
  fieldNote?: string
  options?: CMSFieldOption[]
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  required?: boolean
  name?: string
  error?: string
  id?: string
  className?: string
}

/**
 * A dropdown select field component using Radix UI.
 * Supports predefined options configured in the field metadata or via props.
 */
export default function SelectField({
  field,
  label,
  description,
  fieldNote,
  options: optionsProp,
  value,
  onChange,
  disabled = false,
  placeholder,
  required,
  name,
  error,
  id,
  className,
}: SelectFieldProps) {
  const displayLabel = label || field?.field_label || ""
  const displayDescription = description || field?.field_description || ""
  const displayFieldNote = fieldNote || field?.field_note || ""
  const displayRequired = required || field?.is_required || false
  const displayName = name || field?.field_name || ""
  const displayOptions: CMSFieldOption[] =
    optionsProp || (field?.settings?.choices as CMSFieldOption[]) || []
  const displayPlaceholder =
    placeholder || `Select ${displayLabel.toLowerCase()}...`
  const inputId = id || `select-field-${displayName}`

  return (
    <FieldWrapper
      id={inputId}
      label={displayLabel}
      description={displayDescription}
      fieldNote={displayFieldNote}
      error={error}
      required={displayRequired}
      className={className}
    >
      <div className={s.selectRoot}>
        <Select.Root
          value={value || ""}
          onValueChange={onChange}
          disabled={disabled}
          required={displayRequired}
          name={displayName}
        >
          <Select.Trigger
            className={clsx(s.trigger, error && s.error)}
            aria-label={displayLabel}
            id={inputId}
          >
            <Select.Value placeholder={displayPlaceholder} />
            <Select.Icon className={s.triggerIcon}>
              <ChevronDown size={16} />
            </Select.Icon>
          </Select.Trigger>

          <Select.Content
            className={s.content}
            position="popper"
            sideOffset={4}
          >
            <Select.ScrollUpButton className={s.scrollButton}>
              <ChevronUp size={16} />
            </Select.ScrollUpButton>

            <Select.Viewport className={s.viewport}>
              {displayOptions.map((option) => (
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

              {displayOptions.length === 0 && (
                <div className={s.item} style={{ pointerEvents: "none" }}>
                  <Select.ItemText>No options configured</Select.ItemText>
                </div>
              )}
            </Select.Viewport>

            <Select.ScrollDownButton className={s.scrollButton}>
              <ChevronDown size={16} />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Root>
      </div>
    </FieldWrapper>
  )
}
