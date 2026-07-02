"use client"

import React from "react"
import { CheckboxField } from "@/components/fields"
import { FieldFormHook } from "../../_hooks/use-field-form"
import s from "../../style.module.css"

const RICH_TEXT_TOOLS = [
  { id: "headings", label: "Headings" },
  { id: "bold", label: "Bold" },
  { id: "italic", label: "Italic" },
  { id: "underline", label: "Underline" },
  { id: "strike", label: "Strikethrough" },
  { id: "highlight", label: "Highlight" },
  { id: "align", label: "Alignment" },
  { id: "list_bullet", label: "Bullet List" },
  { id: "list_ordered", label: "Ordered List" },
  { id: "blockquote", label: "Blockquote" },
  { id: "hr", label: "Horizontal Rule" },
  { id: "link", label: "Links" },
  { id: "image", label: "Images" },
  { id: "color", label: "Text Color" },
  { id: "history", label: "Undo/Redo" },
]

interface RichTextSettingsProps {
  form: FieldFormHook
}

export default function RichTextSettings({ form }: RichTextSettingsProps) {
  return (
    <div className={s.referenceSettings}>
      <hr className={s.separator} />
      <h4 className={s.settingsTitle}>Enabled Tools</h4>
      <div className={s.checkboxGroup}>
        {RICH_TEXT_TOOLS.map((tool) => (
          <CheckboxField
            key={tool.id}
            label={tool.label}
            checked={form.enabledTools.includes(tool.id)}
            onChange={(checked) => {
              if (checked) {
                form.setEnabledTools([...form.enabledTools, tool.id])
              } else {
                form.setEnabledTools(
                  form.enabledTools.filter((t) => t !== tool.id)
                )
              }
            }}
          />
        ))}
      </div>
      <p className={s.fieldDescription}>
        Uncheck tools to disable them in the editor. If all are unchecked, the
        editor will show a minimal interface.
      </p>
    </div>
  )
}
