"use client"

import React, { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from "lucide-react"
import clsx from "clsx"
import s from "./style.module.css"

interface CollapsibleDndWrapperProps {
  id: string
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  onDelete?: () => void
  defaultOpen?: boolean
  className?: string
}

/**
 * A standardized wrapper for items that need to be both draggable and collapsible.
 * Used for Fieldsets in the Model Schema and will be used for Blocks in Modular Content.
 */
export default function CollapsibleDndWrapper({
  id,
  label,
  icon,
  children,
  onDelete,
  defaultOpen = true,
  className,
}: CollapsibleDndWrapperProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(s.wrapper, isDragging && s.dragging, className)}
    >
      <div className={s.header}>
        <div className={s.headerLeft}>
          <button
            type="button"
            className={s.dragHandle}
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>

          <button
            type="button"
            className={s.toggleButton}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {icon && <span className={s.icon}>{icon}</span>}
            <span className={s.label}>{label}</span>
          </button>
        </div>

        <div className={s.headerRight}>
          {onDelete && (
            <button
              type="button"
              className={s.deleteButton}
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {isOpen && <div className={s.content}>{children}</div>}
    </div>
  )
}
