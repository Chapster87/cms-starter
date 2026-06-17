"use client"

import React, { useState, useMemo } from "react"
import parse from "html-react-parser"
import { marked } from "marked"
import * as Tabs from "@radix-ui/react-tabs"
import FieldWrapper from "../field-wrapper"
import s from "./style.module.css"

interface MarkdownFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
  name?: string
  rows?: number
  placeholder?: string
}

/**
 * A specialized field for editing Markdown content.
 * Features a Write and Preview tab.
 */
export default function MarkdownField({
  label,
  value,
  onChange,
  description,
  fieldNote,
  required,
  disabled,
  name,
  rows = 10,
  placeholder,
}: MarkdownFieldProps) {
  const id = React.useId()
  const [activeTab, setActiveTab] = useState("write")

  const previewHtml = useMemo(() => {
    if (!value) return ""
    try {
      // Configure marked for security and better formatting
      return marked.parse(value, {
        breaks: true,
        gfm: true,
        async: false,
      }) as string
    } catch (err) {
      console.error("Markdown parsing error:", err)
      return "Error parsing markdown"
    }
  }, [value])

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className={s.tabsRoot}
      >
        <Tabs.List className={s.tabsList}>
          <Tabs.Trigger value="write" className={s.tabsTrigger}>
            Write
          </Tabs.Trigger>
          <Tabs.Trigger value="preview" className={s.tabsTrigger}>
            Preview
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="write" className={s.tabsContent}>
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={rows}
            className={s.textarea}
            placeholder={placeholder || "Write markdown here..."}
          />
        </Tabs.Content>

        <Tabs.Content value="preview" className={s.tabsContent}>
          <div className={s.previewArea}>
            {value ? (
              parse(previewHtml)
            ) : (
              <p className={s.empty}>Nothing to preview</p>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </FieldWrapper>
  )
}
