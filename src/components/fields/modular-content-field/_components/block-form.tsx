"use client"

import React, { useEffect, useState } from "react"
import {
  TextField,
  NumberField,
  MarkdownField,
  RichTextField,
  SelectField,
  CheckboxField,
  JsonField,
  TagField,
  ColorField,
  MediaField,
  SeoField,
  DateField,
  ReferenceField,
} from "@/components/fields"
import { CMSField } from "@/types/fields"
import { MediaAsset } from "@/types/cms-generated"

interface BlockFormProps {
  blockId: string
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  disabled?: boolean
}

/**
 * A specialized form component for rendering fields within a CMS Block.
 * Blocks are nested within Modular Content or Structured Text fields.
 */
export default function BlockForm({
  blockId,
  data,
  onChange,
  disabled,
}: BlockFormProps) {
  const [fields, setFields] = useState<CMSField[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFields() {
      try {
        const response = await fetch(`/api/blocks/fields?blockId=${blockId}`)
        if (!response.ok) throw new Error("Failed to fetch block fields")
        const fieldData = await response.json()
        setFields(fieldData)
      } catch (error) {
        console.error("Error fetching block fields:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFields()
  }, [blockId])

  function handleFieldChange(slug: string, value: unknown) {
    onChange({
      ...data,
      [slug]: value,
    })
  }

  if (loading) {
    return (
      <div style={{ padding: "16px", fontSize: "12px", opacity: 0.6 }}>
        Loading block fields...
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div style={{ padding: "16px", fontSize: "12px", opacity: 0.6 }}>
        No fields defined for this block.
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {fields.map((field) => {
        const value = data[field.slug]
        const commonProps = {
          label: field.field_label,
          description: field.field_description,
          fieldNote: field.field_note || undefined,
          required: field.is_required,
          disabled: disabled,
          name: field.slug,
        }

        if (field.field_type === "boolean") {
          return (
            <CheckboxField
              key={field.id}
              {...commonProps}
              checked={!!value}
              onChange={(checked) => handleFieldChange(field.slug, checked)}
            />
          )
        }

        if (field.field_type === "number") {
          return (
            <NumberField
              key={field.id}
              {...commonProps}
              value={(value as number) ?? ""}
              onChange={(val) => handleFieldChange(field.slug, val)}
              min={field.settings?.min}
              max={field.settings?.max}
              step={field.settings?.step}
              placeholder={field.settings?.placeholder}
            />
          )
        }

        if (field.field_type === "text_multi") {
          return (
            <MarkdownField
              key={field.id}
              {...commonProps}
              value={(value as string) || ""}
              onChange={(val) => handleFieldChange(field.slug, val)}
              placeholder={field.settings?.placeholder}
            />
          )
        }

        if (field.field_type === "rich_text") {
          return (
            <RichTextField
              key={field.id}
              {...commonProps}
              value={(value as string) || ""}
              onChange={(val) => handleFieldChange(field.slug, val)}
              enabledTools={field.settings?.enabled_tools}
              placeholder={field.settings?.placeholder}
            />
          )
        }

        if (field.field_type === "select") {
          return (
            <SelectField
              key={field.id}
              field={field}
              value={(value as string) || ""}
              onChange={(val) => handleFieldChange(field.slug, val)}
            />
          )
        }

        if (field.field_type === "color") {
          return (
            <ColorField
              key={field.id}
              {...commonProps}
              value={(value as string) || ""}
              onChange={(val) => handleFieldChange(field.slug, val)}
            />
          )
        }

        if (field.field_type === "media") {
          const isMultiple = !!(
            field.settings?.multiple || field.settings?.allow_multiple
          )
          return (
            <MediaField
              key={field.id}
              {...commonProps}
              value={value as string | MediaAsset | MediaAsset[]}
              onChange={(val) => handleFieldChange(field.slug, val)}
              multiple={isMultiple}
            />
          )
        }

        if (field.field_type === "tags") {
          return (
            <TagField
              key={field.id}
              {...commonProps}
              value={(value as string[]) || []}
              onChange={(val) => handleFieldChange(field.slug, val)}
              placeholder={field.settings?.placeholder}
            />
          )
        }

        if (field.field_type === "date_time") {
          const showTime = field.settings?.include_time !== false
          return (
            <DateField
              key={field.id}
              {...commonProps}
              showTime={showTime}
              value={(value as string) || ""}
              onChange={(val) => handleFieldChange(field.slug, val)}
            />
          )
        }

        if (field.field_type === "reference") {
          return (
            <ReferenceField
              key={field.id}
              {...commonProps}
              allowedModels={(field.settings?.allowed_models as string[]) || []}
              allowMultiple={!!field.settings?.allow_multiple}
              value={(value as string | string[]) || null}
              onChange={(val) => handleFieldChange(field.slug, val)}
            />
          )
        }

        if (field.field_type === "json") {
          const jsonValue =
            typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : (value as string) || ""
          return (
            <JsonField
              key={field.id}
              {...commonProps}
              value={jsonValue}
              onChange={(val) => handleFieldChange(field.slug, val)}
            />
          )
        }

        if (field.field_type === "seo_metadata") {
          return (
            <SeoField
              key={field.id}
              {...commonProps}
              value={(value as string) || ""}
              onChange={(val) => handleFieldChange(field.slug, val)}
            />
          )
        }

        return (
          <TextField
            key={field.id}
            {...commonProps}
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.slug, e.target.value)}
            placeholder={field.settings?.placeholder}
          />
        )
      })}
    </div>
  )
}
