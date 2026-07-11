"use client"

import React, { useState, useEffect } from "react"
import TextField from "../text-field"
import { useSiteSettings } from "@/hooks/use-site-settings"
import s from "./style.module.css"

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
  /** Whether to show the URL preview prefix. Defaults to true. */
  showUrlPrefix?: boolean
  /** Optional custom URL prefix to override site settings. */
  urlPrefix?: string
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
  showUrlPrefix = true,
  urlPrefix,
}: SlugFieldProps) {
  const { settings } = useSiteSettings()
  const [internalIsTouched, setInternalIsTouched] = useState(false)
  // Track if we've already done the initial check to see if the slug was manually edited
  const [isInitialized, setIsInitialized] = useState(false)

  const isTouched = controlledIsTouched ?? internalIsTouched

  // Helper to sanitize string into a slug
  const slugify = React.useCallback(
    (text: string) => {
      if (!text) return ""
      const escapedSeparator = separator === "-" ? "-" : "_"
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
    },
    [separator]
  )

  // On mount or when initial data arrives, check if we should be "touched"
  // If the current value exists and doesn't match the auto-generated slug,
  // it means it was previously saved with a custom value.
  useEffect(() => {
    if (isInitialized) return

    // If we have both, check for custom value
    if (value && sourceValue) {
      const generated = slugify(sourceValue)
      const isCustom = generated !== value

      // Defer all state updates to avoid cascading render warning
      const timer = setTimeout(() => {
        if (isCustom) {
          if (onToggleTouched) {
            onToggleTouched(true)
          } else {
            setInternalIsTouched(true)
          }
        }
        setIsInitialized(true)
      }, 0)
      return () => clearTimeout(timer)
    }

    // If both are empty (new record) OR we have source but no slug (auto-gen needed)
    // mark as initialized so the sync effect can take over
    if (!value) {
      const timer = setTimeout(() => {
        setIsInitialized(true)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [value, sourceValue, slugify, isInitialized, onToggleTouched])

  // Sync with sourceValue if not touched.
  // We remove the !value check so it continues to sync as the user types in the source field.
  useEffect(() => {
    // Only auto-sync if we've initialized and aren't touched
    if (
      isInitialized &&
      !isTouched &&
      sourceValue !== undefined &&
      sourceValue !== ""
    ) {
      const newSlug = slugify(sourceValue)
      if (newSlug !== value) {
        onChange(newSlug)
      }
    }
  }, [sourceValue, isTouched, onChange, value, slugify, isInitialized])

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

  const siteUrl =
    urlPrefix?.replace(/\/$/, "") ||
    settings?.siteUrl?.replace(/\/$/, "") ||
    "https://example.com"

  return (
    <div className={s.slugFieldContainer}>
      <TextField
        label={label}
        name={name}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        description={description}
        required={required}
        disabled={disabled}
        leftElement={
          showUrlPrefix ? (
            <div className={s.urlPrefix}>{siteUrl}/</div>
          ) : undefined
        }
      />
    </div>
  )
}
