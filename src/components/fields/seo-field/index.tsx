"use client"

import React from "react"
import * as Accordion from "@radix-ui/react-accordion"
import TextField from "../text-field"
import TextAreaField from "../text-area-field"
import TagField from "../tag-field"
import MediaField from "../media-field"
import SelectField from "../select-field"
import JsonField from "../json-field"
import s from "./style.module.css"

interface SeoMetadata {
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  ogImage?: string
  canonicalUrl?: string
  robots?: string
  jsonLd?: string
}

interface SeoFieldProps {
  label: string
  value: string | SeoMetadata
  onChange: (value: string) => void
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
}

/**
 * A composite field for managing SEO metadata.
 * Uses an Accordion to group multiple sub-fields.
 */
export default function SeoField({
  label,
  value,
  onChange,
  description,
  fieldNote,
  disabled,
}: SeoFieldProps) {
  const data: SeoMetadata = React.useMemo(() => {
    if (!value) return {}
    if (typeof value === "object") return value
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }, [value])

  const handleChange = (key: keyof SeoMetadata, val: unknown) => {
    const newData = { ...data, [key]: val }
    onChange(JSON.stringify(newData))
  }

  return (
    <div className={s.seoWrapper}>
      <Accordion.Root
        type="single"
        collapsible
        className={s.accordionRoot}
        defaultValue="seo-fields"
      >
        <Accordion.Item value="seo-fields" className={s.accordionItem}>
          <Accordion.Header className={s.accordionHeader}>
            <Accordion.Trigger className={s.accordionTrigger}>
              <div className={s.headerContent}>
                <span className={s.label}>{label}</span>
                {description && <span className={s.desc}>{description}</span>}
              </div>
              <svg className={s.chevron}>
                <use xlinkHref="/feather-sprite.svg#chevron-down" />
              </svg>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={s.accordionContent}>
            <div className={s.fieldsGrid}>
              <TextField
                label="Meta Title"
                value={data.metaTitle || ""}
                onChange={(e) => handleChange("metaTitle", e.target.value)}
                disabled={disabled}
                description="The title tag for search engines."
              />
              <TextAreaField
                label="Meta Description"
                value={data.metaDescription || ""}
                onChange={(e) =>
                  handleChange("metaDescription", e.target.value)
                }
                disabled={disabled}
                rows={3}
                description="The meta description for search result snippets."
              />
              <TagField
                label="Meta Keywords"
                value={data.metaKeywords || []}
                onChange={(val) => handleChange("metaKeywords", val)}
                disabled={disabled}
                description="List of keywords for search engines."
              />
              <MediaField
                label="OG Image"
                value={data.ogImage || ""}
                onChange={(val) => handleChange("ogImage", val)}
                disabled={disabled}
                description="The image shown when sharing on social media."
              />
              <TextField
                label="Canonical URL"
                value={data.canonicalUrl || ""}
                onChange={(e) => handleChange("canonicalUrl", e.target.value)}
                disabled={disabled}
                description="The preferred version of this page's URL."
              />
              <SelectField
                label="Robots"
                value={data.robots || "index, follow"}
                onChange={(val) => handleChange("robots", val)}
                disabled={disabled}
                options={[
                  { label: "Index, Follow", value: "index, follow" },
                  { label: "No Index, Follow", value: "noindex, follow" },
                  { label: "Index, No Follow", value: "index, nofollow" },
                  { label: "No Index, No Follow", value: "noindex, nofollow" },
                ]}
                description="Instructions for search engine crawlers."
              />
              <JsonField
                label="JSON-LD / Structured Data"
                value={data.jsonLd || ""}
                onChange={(val) => handleChange("jsonLd", val)}
                disabled={disabled}
                description="Custom schema.org metadata."
              />
              {fieldNote && <p className={s.fieldNote}>{fieldNote}</p>}
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )
}
