"use client"

import { CheckboxField } from "@/components/fields"
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
  enabledTools: string[]
  setEnabledTools: (tools: string[]) => void
}

export default function RichTextSettings({
  enabledTools,
  setEnabledTools,
}: RichTextSettingsProps) {
  return (
    <div className={s.advancedSettingsSection}>
      <hr className={s.separator} />
      <h4 className={s.settingsTitle}>Enabled Tools</h4>
      <div className={s.checkboxGrid}>
        {RICH_TEXT_TOOLS.map((tool) => (
          <div key={tool.id}>
            <CheckboxField
              label={tool.label}
              checked={enabledTools.includes(tool.id)}
              onChange={(checked) => {
                if (checked) {
                  setEnabledTools([...enabledTools, tool.id])
                } else {
                  setEnabledTools(enabledTools.filter((t) => t !== tool.id))
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
