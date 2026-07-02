"use client"

import React from "react"
import { FieldFormHook } from "../../_hooks/use-field-form"
import DateTimeSettings from "./date-time-settings"
import MediaSettings from "./media-settings"
import NavigationSettings from "./navigation-settings"
import ReferenceSettings from "./reference-settings"
import RichTextSettings from "./rich-text-settings"
import SelectSettings from "./select-settings"

interface FieldSpecificRegistryProps {
  form: FieldFormHook
}

/**
 * Registry for field-specific settings components.
 * Delegates rendering based on the current field type.
 */
export default function FieldSpecificRegistry({
  form,
}: FieldSpecificRegistryProps) {
  const { type } = form

  switch (type) {
    case "rich_text":
      return <RichTextSettings form={form} />
    case "select":
      return <SelectSettings form={form} />
    case "reference":
      return <ReferenceSettings form={form} />
    case "navigation":
      return <NavigationSettings form={form} />
    case "date_time":
      return <DateTimeSettings form={form} />
    case "media":
      return <MediaSettings form={form} />
    default:
      return null
  }
}
