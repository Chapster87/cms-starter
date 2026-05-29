import React from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CMSField } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"
import s from "./style.module.css"

interface SortableFieldCardProps {
  field: CMSField
  getIconCategory: (type: string) => string
  onEdit: (field: CMSField) => void
  onDuplicate: (field: CMSField) => void
  onDelete: (field: CMSField) => void
}

export function SortableFieldCard({
  field,
  getIconCategory,
  onEdit,
  onDuplicate,
  onDelete,
}: SortableFieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  }

  const definition = FIELD_DEFINITIONS.find((d) => d.type === field.field_type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${s.fieldCard} ${isDragging ? s.isDragging : ""}`}
    >
      <div className={s.dragHandle} {...attributes} {...listeners}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="16" y2="6"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
          <line x1="8" y1="18" x2="16" y2="18"></line>
        </svg>
      </div>

      <div className={`${s.fieldIcon} ${getIconCategory(field.field_type)}`}>
        {field.field_type === "json" ? "{...}" : "A"}
      </div>

      <div className={s.fieldContent}>
        <div className={s.fieldMainInfo}>
          <span
            className={`${s.fieldLabel} ${
              field.is_required ? s.fieldLabelRequired : ""
            }`}
          >
            {field.field_label}
          </span>
          <span className={s.fieldName}>{field.field_name}</span>
        </div>
        <div className={s.fieldTypeLabel}>
          {definition?.label || field.field_type}
        </div>
      </div>

      <div className={s.fieldActions}>
        <div className={s.fieldBadges}>
          {field.is_unique && <span className={s.uniqueBadge}>Unique</span>}
          {field.is_system && <span className={s.systemBadge}>System</span>}
        </div>

        <button
          className={s.editFieldButton}
          onClick={() => onEdit(field)}
          type="button"
        >
          Edit field
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className={s.menuTrigger} aria-label="More options">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={s.menuContent}
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Item
                className={s.menuItem}
                onSelect={() => onDuplicate(field)}
              >
                Duplicate
              </DropdownMenu.Item>
              {!field.is_system && (
                <DropdownMenu.Item
                  className={`${s.menuItem} ${s.deleteItem}`}
                  onSelect={() => onDelete(field)}
                >
                  Delete
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  )
}
