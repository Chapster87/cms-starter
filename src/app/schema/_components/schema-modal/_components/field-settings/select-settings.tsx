"use client"

import React from "react"
import { Plus, Trash2 } from "lucide-react"
import Button from "@/components/button"
import { FieldFormHook } from "../../_hooks/use-field-form"
import s from "../../style.module.css"

interface SelectSettingsProps {
  form: FieldFormHook
}

export default function SelectSettings({ form }: SelectSettingsProps) {
  return (
    <div className={s.referenceSettings}>
      <hr className={s.separator} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4 className={s.settingsTitle}>Dropdown Options</h4>
        <Button
          type="button"
          unstyled
          onClick={form.handleAddChoice}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "var(--color-primary)",
          }}
        >
          <Plus size={14} /> Add Option
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "12px",
        }}
      >
        {form.choices.map((choice, index) => (
          <div key={index} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className={s.nameInput}
              placeholder="Label (e.g. Red)"
              value={choice.label}
              onChange={(e) =>
                form.handleUpdateChoice(index, "label", e.target.value)
              }
              style={{ flex: 1 }}
            />
            <input
              type="text"
              className={s.nameInput}
              placeholder="Value (e.g. red)"
              value={choice.value}
              onChange={(e) =>
                form.handleUpdateChoice(index, "value", e.target.value)
              }
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              unstyled
              onClick={() => form.handleRemoveChoice(index)}
              style={{
                padding: "0 8px",
                color: "var(--color-grey-400)",
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        {form.choices.length === 0 && (
          <p className={s.fieldDescription}>No options added yet.</p>
        )}
      </div>
    </div>
  )
}
