"use client"

import React from "react"
import { GripVertical, Edit2, Trash2 } from "lucide-react"
import clsx from "clsx"

import Button from "@/components/button"
import { CMSFieldset } from "@/types/fields"

import s from "./style.module.css"

interface SortableFieldsetCardProps {
  fieldset: CMSFieldset
  onEdit: (fieldset: CMSFieldset) => void
  onDelete: (fieldset: CMSFieldset) => void
  isDragging?: boolean
  isOver?: boolean
  dragHandleProps?: Record<string, unknown>
}

/**
 * A draggable card representing a Fieldset header in the schema builder.
 */
export function SortableFieldsetCard({
  fieldset,
  onEdit,
  onDelete,
  isDragging,
  isOver,
  dragHandleProps,
}: SortableFieldsetCardProps) {
  return (
    <div
      className={clsx(
        s.fieldsetCard,
        isDragging && s.dragging,
        isOver && s.isOver
      )}
    >
      <div className={s.fieldsetGrip} {...dragHandleProps}>
        <GripVertical size={16} />
      </div>

      <div className={s.fieldsetInfo}>
        <div className={s.fieldsetLabelGroup}>
          <span className={s.fieldsetLabel}>{fieldset.label}</span>
        </div>
      </div>

      <div className={s.fieldActions}>
        <Button
          variant="secondary"
          unstyled
          className={s.actionButton}
          onClick={() => onEdit(fieldset)}
          title="Edit Group"
        >
          <Edit2 size={14} />
        </Button>
        <Button
          variant="secondary"
          unstyled
          className={s.actionButton}
          onClick={() => onDelete(fieldset)}
          title="Delete Group"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  )
}
