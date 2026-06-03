"use client"

import React, { useState, useEffect } from "react"
import TextField from "../text-field"

interface SlugFieldProps {
  label: string
  sourceValue?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  name?: string
  /** Whether the field has been manually edited. If true, it stops syncing with sourceValue. */
  isTouched?: boolean
  onToggleTouched?: (touched: boolean) => void
}

/**
 * A specialized field for slugs and technical IDs.
 * It automatically generates a slug from a source value until manually overridden.
 */
export default function SlugField({
  label,
  sourceValue,
  value,
  onChange,
  placeholder,
  description,
  required,
  disabled,
  name,
  isTouched: controlledIsTouched,
  onToggleTouched,
}: SlugFieldProps) {
  const [internalIsTouched, setInternalIsTouched] = useState(false)

  const isTouched = controlledIsTouched ?? internalIsTouched

  // Helper to sanitize string into a slug
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_") // Replace non-alphanumeric with underscore
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .replace(/^_|_$/g, "") // Trim underscores from ends
  }

  // Sync with sourceValue if not touched
  useEffect(() => {
    if (!isTouched && sourceValue !== undefined && sourceValue !== "") {
      const newSlug = slugify(sourceValue)
      if (newSlug !== value) {
        onChange(newSlug)
      }
    }
  }, [sourceValue, isTouched, onChange, value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")

    if (!isTouched) {
      if (onToggleTouched) {
        onToggleTouched(true)
      } else {
        setInternalIsTouched(true)
      }
    }

    onChange(val)
  }

  return (
    <TextField
      label={label}
      name={name}
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      description={description}
      required={required}
      disabled={disabled}
    />
  )
}
