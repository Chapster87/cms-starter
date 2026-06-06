"use client"

import { useState, useEffect } from "react"
import {
  TextField,
  NumberField,
  MarkdownField,
  RichTextField,
  CheckboxField,
  JsonField,
  TagField,
  ColorField,
  MediaField,
  SlugField,
  SeoField,
  DateField,
  ReferenceField,
  NavigationField,
} from "@/components/fields"
import Button from "@/components/button"
import { useAuth } from "@/hooks/use-auth"
import { CMSField } from "@/types/fields"
import { NavigationData } from "@/types/navigation"
import s from "./style.module.css"

interface FieldSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface RecordFormProps {
  model: string
  initialData?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  isLoading: boolean
}

/**
 * A dynamic form component that generates inputs based on a table's schema.
 */
export default function RecordForm({
  model,
  initialData,
  onSubmit,
  isLoading,
}: RecordFormProps) {
  const { accessToken } = useAuth()
  const [schema, setSchema] = useState<CMSField[]>([])
  const [formData, setFormData] = useState<Record<string, unknown>>(
    initialData || {}
  )
  const [fetchingSchema, setFetchingSchema] = useState(true)

  // Sync internal form data with initialData when it changes from above
  useEffect(() => {
    if (initialData) {
      // Use setTimeout to move state update out of the synchronous render cycle
      const timer = setTimeout(() => {
        setFormData(initialData)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [initialData])

  useEffect(() => {
    let isMounted = true
    const fetchSchema = async () => {
      if (!isMounted) return
      console.log(`RecordForm: Fetching schema for model table: ${model}`)
      setFetchingSchema(true)
      try {
        const headers: Record<string, string> = {}
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        // 1. Fetch CMS-defined fields from the registry using the table name
        const response = await fetch(
          `/api/models/schema/fields?table=${model}`,
          { headers }
        )
        if (!response.ok) throw new Error("Failed to fetch fields")
        const data = await response.json()

        if (data && data.length > 0) {
          if (!isMounted) return
          console.log(`RecordForm: Loaded ${data.length} fields from registry.`)
          setSchema(data)
        } else {
          // Fallback: If no registry entry found, try to fetch raw schema
          const response = await fetch(`/api/models/schema?table=${model}`, {
            headers,
          })
          if (!response.ok) throw new Error("Failed to fetch schema")
          const data = await response.json()

          // Map raw schema to partial CMSField objects for compatibility
          const mappedFields = data
            .filter(
              (f: FieldSchema) =>
                !["id", "created_at", "updated_at"].includes(f.column_name)
            )
            .map((f: FieldSchema) => ({
              id: f.column_name,
              field_name: f.column_name,
              field_label: f.column_name.replace(/_/g, " "),
              field_type:
                f.data_type === "boolean"
                  ? "boolean"
                  : f.data_type === "integer" || f.data_type === "numeric"
                    ? "number"
                    : "text_single",
              is_required: f.is_nullable === "NO",
            }))

          if (!isMounted) return
          setSchema(mappedFields)
        }
      } catch (err) {
        if (!isMounted) return
        console.error("Error fetching schema:", err)
      } finally {
        if (!isMounted) return
        setFetchingSchema(false)
      }
    }
    fetchSchema()
    return () => {
      isMounted = false
    }
  }, [model, accessToken])

  const handleChange = (columnName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [columnName]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (fetchingSchema) return <p>Loading form fields...</p>

  return (
    <form onSubmit={handleSubmit} className={s.form}>
      {schema.map((field) => {
        const commonProps = {
          label: field.field_label,
          description: field.field_description,
          fieldNote: field.field_note || undefined,
          required: field.is_required,
          disabled: isLoading,
          name: field.field_name,
        }

        if (field.field_type === "boolean") {
          return (
            <CheckboxField
              key={field.field_name}
              {...commonProps}
              checked={!!formData[field.field_name]}
              onChange={(checked) => handleChange(field.field_name, checked)}
            />
          )
        }

        if (field.field_type === "number") {
          return (
            <NumberField
              key={field.field_name}
              {...commonProps}
              value={(formData[field.field_name] as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "text_multi") {
          return (
            <MarkdownField
              key={field.field_name}
              {...commonProps}
              value={(formData[field.field_name] as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
              rows={6}
            />
          )
        }

        if (field.field_type === "rich_text") {
          return (
            <RichTextField
              key={field.field_name}
              {...commonProps}
              value={(formData[field.field_name] as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "color") {
          return (
            <ColorField
              key={field.field_name}
              {...commonProps}
              value={(formData[field.field_name] as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "seo_slug") {
          // Attempt to find a "source" field for the slug (like 'title' or 'name')
          const sourceField = schema.find(
            (f) =>
              f.field_name === "title" ||
              f.field_name === "name" ||
              f.field_label.toLowerCase() === "title"
          )
          const sourceValue = sourceField
            ? (formData[sourceField.field_name] as string)
            : ""

          return (
            <SlugField
              key={field.field_name}
              {...commonProps}
              value={(formData[field.field_name] as string) || ""}
              sourceValue={sourceValue}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "media") {
          return (
            <MediaField
              key={field.field_name}
              {...commonProps}
              value={(formData[field.field_name] as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
              multiple
            />
          )
        }

        if (field.field_type === "seo_metadata") {
          return (
            <SeoField
              key={field.field_name}
              {...commonProps}
              value={(formData[field.field_name] as string) || ""}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "tags") {
          return (
            <TagField
              key={field.field_name}
              {...commonProps}
              value={(formData[field.field_name] as string) || []}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (["json", "modular_content"].includes(field.field_type)) {
          const jsonValue =
            typeof formData[field.field_name] === "object"
              ? JSON.stringify(formData[field.field_name], null, 2)
              : (formData[field.field_name] as string) || ""

          return (
            <JsonField
              key={field.field_name}
              {...commonProps}
              value={jsonValue}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "date_time") {
          return (
            <DateField
              key={field.field_name}
              {...commonProps}
              showTime
              value={(formData[field.field_name] as string) || ""}
              onChange={(e) => handleChange(field.field_name, e.target.value)}
            />
          )
        }

        if (field.field_type === "reference") {
          const settings = (field.settings || {}) as Record<string, unknown>
          return (
            <ReferenceField
              key={field.field_name}
              {...commonProps}
              allowedModels={(settings.allowed_models as string[]) || []}
              allowMultiple={!!settings.allow_multiple}
              value={(formData[field.field_name] as string | string[]) || null}
              onChange={(val) => handleChange(field.field_name, val)}
            />
          )
        }

        if (field.field_type === "navigation") {
          const settings = (field.settings || {}) as Record<string, unknown>
          return (
            <NavigationField
              key={field.field_name}
              {...commonProps}
              value={(formData[field.field_name] as NavigationData) || null}
              onChange={(val) => handleChange(field.field_name, val)}
              settings={settings}
            />
          )
        }

        return (
          <TextField
            key={field.field_name}
            {...commonProps}
            value={(formData[field.field_name] as string) || ""}
            onChange={(e) => handleChange(field.field_name, e.target.value)}
          />
        )
      })}
      <Button type="submit" isLoading={isLoading} disabled={isLoading}>
        Save Record
      </Button>
    </form>
  )
}
