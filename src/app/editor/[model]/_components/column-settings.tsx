"use client"

import { useState, useMemo } from "react"
import { CMSField } from "@/types/fields"
import { ModelRegistryEntry } from "@/hooks/use-models"
import Button from "@/components/button"
import * as Popover from "@radix-ui/react-popover"
import { Settings, Check, ChevronUp, ChevronDown } from "lucide-react"
import s from "./style.module.css"

interface ColumnSettingsProps {
  model: ModelRegistryEntry
  fields: CMSField[]
  onUpdate: (columns: string[]) => Promise<void>
}

/**
 * Utility to configure which columns are visible in the record list.
 */
export default function ColumnSettings({
  model,
  fields,
  onUpdate,
}: ColumnSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const currentColumns = useMemo(() => {
    if (model.list_columns && model.list_columns.length > 0) {
      return model.list_columns
    }
    // Fallback default: first non-system field
    const firstField = fields.find((f) => !f.is_system)
    if (firstField) {
      return [firstField.slug]
    }
    return []
  }, [model.list_columns, fields])

  const toggleColumn = async (fieldName: string) => {
    let newCols = [...currentColumns]
    if (newCols.includes(fieldName)) {
      // Don't allow removing the last column
      if (newCols.length > 1) {
        newCols = newCols.filter((c) => c !== fieldName)
      }
    } else {
      newCols.push(fieldName)
    }

    setIsSaving(true)
    try {
      await onUpdate(newCols)
    } finally {
      setIsSaving(false)
    }
  }

  const moveColumn = async (fieldName: string, direction: "up" | "down") => {
    const idx = currentColumns.indexOf(fieldName)
    if (idx === -1) return

    const newCols = [...currentColumns]
    const targetIdx = direction === "up" ? idx - 1 : idx + 1

    if (targetIdx >= 0 && targetIdx < newCols.length) {
      ;[newCols[idx], newCols[targetIdx]] = [newCols[targetIdx], newCols[idx]]
      setIsSaving(true)
      try {
        await onUpdate(newCols)
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="secondary"
          beforeText={<Settings size={16} />}
          className={s.triggerButton}
        >
          Columns
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={s.popoverContent}
          sideOffset={5}
          align="end"
        >
          <div className={s.popoverHeader}>
            <h3>Display Columns</h3>
          </div>
          <div className={s.fieldList}>
            {/* Display active columns first in their actual order */}
            {currentColumns.map((colName) => {
              const field = fields.find((f) => f.slug === colName)
              if (!field) return null
              const colIdx = currentColumns.indexOf(colName)

              return (
                <div key={field.id} className={s.fieldItemWrapper}>
                  <button
                    className={`${s.fieldItem} ${s.active}`}
                    onClick={() => toggleColumn(field.slug)}
                    disabled={isSaving}
                  >
                    <div className={s.fieldCheck}>
                      <Check size={14} />
                    </div>
                    <span className={s.fieldName}>{field.field_label}</span>
                  </button>

                  <div className={s.orderActions}>
                    <button
                      className={s.orderButton}
                      onClick={() => moveColumn(field.slug, "up")}
                      disabled={isSaving || colIdx === 0}
                      title="Move Up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      className={s.orderButton}
                      onClick={() => moveColumn(field.slug, "down")}
                      disabled={
                        isSaving || colIdx === currentColumns.length - 1
                      }
                      title="Move Down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Separator if we have inactive fields */}
            {fields.some(
              (f) => !f.is_system && !currentColumns.includes(f.slug)
            ) && <div className={s.separator} />}

            {/* Display inactive fields */}
            {fields
              .filter((f) => !f.is_system && !currentColumns.includes(f.slug))
              .map((field) => (
                <div key={field.id} className={s.fieldItemWrapper}>
                  <button
                    className={s.fieldItem}
                    onClick={() => toggleColumn(field.slug)}
                    disabled={isSaving}
                  >
                    <div className={s.fieldCheck} />
                    <span className={s.fieldName}>{field.field_label}</span>
                  </button>
                </div>
              ))}
          </div>
          <Popover.Arrow className={s.popoverArrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
