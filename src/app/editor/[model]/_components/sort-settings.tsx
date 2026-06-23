"use client"

import { CMSField } from "@/types/fields"
import Button from "@/components/button"
import * as Popover from "@radix-ui/react-popover"
import { ArrowDownAZ, ArrowUpAZ, ChevronDown } from "lucide-react"
import s from "./style.module.css"

interface SortSettingsProps {
  fields: CMSField[]
  sortColumn: string
  sortDirection: "asc" | "desc"
  onSortChange: (column: string, direction: "asc" | "desc") => void
}

/**
 * Component for controlling the record list sorting.
 */
export default function SortSettings({
  fields,
  sortColumn,
  sortDirection,
  onSortChange,
}: SortSettingsProps) {
  // We include system fields like created_at and updated_at for sorting
  const sortableFields = [
    ...fields.filter((f) => f.field_type !== "media"), // Media usually isn't sortable
    { field_name: "created_at", field_label: "Created At" },
    { field_name: "updated_at", field_label: "Updated At" },
  ]

  const activeField = sortableFields.find((f) => f.field_name === sortColumn)

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button
          variant="secondary"
          beforeText={
            sortDirection === "asc" ? (
              <ArrowUpAZ size={16} />
            ) : (
              <ArrowDownAZ size={16} />
            )
          }
          afterText={<ChevronDown size={14} />}
          className={s.triggerButton}
        >
          Sort: {activeField?.field_label || sortColumn}
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={s.popoverContent}
          sideOffset={5}
          align="end"
        >
          <div className={s.popoverHeader}>
            <h3>Sort By</h3>
          </div>
          <div className={s.fieldList}>
            {sortableFields.map((field) => {
              const isActive = sortColumn === field.field_name

              return (
                <div key={field.field_name} className={s.sortItemWrapper}>
                  <button
                    className={`${s.fieldItem} ${isActive ? s.active : ""}`}
                    onClick={() =>
                      onSortChange(field.field_name, sortDirection)
                    }
                  >
                    <span className={s.fieldName}>{field.field_label}</span>
                  </button>
                  {isActive && (
                    <div className={s.directionToggle}>
                      <button
                        className={`${s.dirButton} ${
                          sortDirection === "asc" ? s.activeDir : ""
                        }`}
                        onClick={() => onSortChange(field.field_name, "asc")}
                        title="Ascending"
                      >
                        <ArrowUpAZ size={14} />
                      </button>
                      <button
                        className={`${s.dirButton} ${
                          sortDirection === "desc" ? s.activeDir : ""
                        }`}
                        onClick={() => onSortChange(field.field_name, "desc")}
                        title="Descending"
                      >
                        <ArrowDownAZ size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <Popover.Arrow className={s.popoverArrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
