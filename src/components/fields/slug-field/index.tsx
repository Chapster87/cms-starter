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
  /** The character used to separate words. Defaults to dash (-) for URLs. Use underscore (_) for technical/DB names. */
  separator?: "-" | "_"
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
  separator = "-",
  isTouched: controlledIsTouched,
  onToggleTouched,
}: SlugFieldProps) {
  const [internalIsTouched, setInternalIsTouched] = useState(false)

  const isTouched = controlledIsTouched ?? internalIsTouched

  // Helper to sanitize string into a slug
  const slugify = (text: string) => {
    const escapedSeparator = separator === "-" ? "-" : "_"
    const regex = new RegExp(`[^a-z0-9${escapedSeparator}]`, "g")
    const repeatRegex = new RegExp(`[${escapedSeparator}]+`, "g")
    const trimRegex = new RegExp(
      `^[${escapedSeparator}]+|[${escapedSeparator}]+$`,
      "g"
    )

    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, separator) // Replace non-alphanumeric with separator
      .replace(repeatRegex, separator) // Replace multiple separators with single
      .replace(trimRegex, "") // Trim separators from ends
  }

  // Sync with sourceValue if not touched.
  // We remove the !value check so it continues to sync as the user types in the source field.
  useEffect(() => {
    if (!isTouched && sourceValue !== undefined && sourceValue !== "") {
      const newSlug = slugify(sourceValue)
      if (newSlug !== value) {
        onChange(newSlug)
      }
    }
  }, [sourceValue, isTouched, onChange, value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const escapedSeparator = separator === "-" ? "-" : "_"
    const regex = new RegExp(`[^a-z0-9${escapedSeparator}]`, "g")
    const val = e.target.value.toLowerCase().replace(regex, separator)

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
