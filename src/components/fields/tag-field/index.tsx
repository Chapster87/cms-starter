"use client"

import React, { useState, KeyboardEvent } from "react"

import Button from "@/components/button"
import FieldWrapper from "../field-wrapper"

import s from "./style.module.css"

interface TagFieldProps {
  label: string
  value: string | string[]
  onChange: (value: string | string[]) => void
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
  name?: string
  placeholder?: string
}

/**
 * A specialized field for managing collections of strings/keywords.
 * Pressing Enter or comma adds a new tag.
 */
export default function TagField({
  label,
  value,
  onChange,
  description,
  fieldNote,
  required,
  disabled,
  name,
  placeholder = "Add tag...",
}: TagFieldProps) {
  const id = React.useId()
  const [inputValue, setInputValue] = useState("")

  const tags: string[] = React.useMemo(() => {
    if (!value) return []
    if (Array.isArray(value)) return value
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }, [value])

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed)) return

    const newTags = [...tags, trimmed]
    onChange(JSON.stringify(newTags))
    setInputValue("")
  }

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    onChange(JSON.stringify(newTags))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <div className={s.tagContainer}>
        <div className={s.tagList}>
          {tags.map((tag, index) => (
            <span key={index} className={s.tag}>
              {tag}
              <Button
                type="button"
                variant="secondary"
                size="small"
                unstyled
                className={s.removeBtn}
                onClick={() => removeTag(index)}
                disabled={disabled}
              >
                ✕
              </Button>
            </span>
          ))}
          <input
            id={id}
            type="text"
            name={name}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addTag(inputValue)}
            placeholder={tags.length === 0 ? placeholder : ""}
            disabled={disabled}
            className={s.input}
          />
        </div>
      </div>
    </FieldWrapper>
  )
}
