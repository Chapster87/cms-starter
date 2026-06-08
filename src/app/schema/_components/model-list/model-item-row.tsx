"use client"

import React from "react"
import Link from "next/link"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Edit2,
  ExternalLink,
  Trash2,
} from "lucide-react"
import Button from "@/components/button"
import ContextMenu from "@/components/context-menu"
import SvgIcon from "@/components/svg-icon"
import {
  TreeItem,
  TreeItemModel,
  TreeItemGroup,
} from "../../_helpers/model-tree-helpers"
import clsx from "clsx"
import s from "./style.module.css"

interface ModelItemRowProps {
  item: TreeItem
  depth: number
  isActive: boolean
  isExpanded?: boolean
  onToggle?: () => void
  onDelete: (name: string) => void
  onDeleteGroup?: (id: string) => void
  isOverlay?: boolean
}

export default function ModelItemRow({
  item,
  depth,
  isActive,
  isExpanded = true,
  onToggle,
  onDelete,
  onDeleteGroup,
  isOverlay,
}: ModelItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: item.id, disabled: isOverlay })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    marginLeft: `${depth * 24}px`,
  }

  const isModel = item.type === "model"

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clsx(
        s.modelListItem,
        isActive && s.isActive,
        isDragging && s.dragging,
        isOverlay && s.overlay,
        isOver && s.isOver,
        !isModel && s.isGroup
      )}
    >
      {/* Indentation Guides - positioned relative to the list item but with negative offset to stay fixed */}
      <div className={s.guidesContainer}>
        {Array.from({ length: depth }).map((_, i) => (
          <div
            key={i}
            className={s.guidePath}
            style={{ left: `-${(depth - i) * 24 - 20}px` }}
          />
        ))}
      </div>

      <div className={s.itemCard}>
        <div className={s.itemMain}>
          {!isModel && (
            <button
              type="button"
              className={s.expandButton}
              onClick={(e) => {
                e.stopPropagation()
                onToggle?.()
              }}
            >
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}

          <div className={s.dragHandle} {...attributes} {...listeners}>
            <span className={s.emoji}>
              {item.emoji || (isModel ? "📄" : "📁")}
            </span>
          </div>

          <div className={s.itemContent}>
            {isModel ? (
              <div className={s.modelInfo}>
                <Link
                  href={`/schema/${(item as TreeItemModel).slug}`}
                  className={s.modelLink}
                >
                  <div className={s.modelName}>
                    <span>{(item as TreeItemModel).friendly_name}</span>
                  </div>
                  <code className={s.modelSlug}>
                    {(item as TreeItemModel).slug}
                  </code>
                </Link>
                {(item as TreeItemModel).is_singleton && (
                  <div className={s.badgeRow}>
                    <span className={s.singletonBadge}>Singleton</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={s.groupName}>
                <span>{(item as TreeItemGroup).name}</span>
              </div>
            )}
          </div>
        </div>

        <div className={s.actions}>
          <ContextMenu>
            <ContextMenu.Trigger className={s.menuTrigger}>
              <Button
                variant="secondary"
                unstyled
                type="button"
                aria-label="More options"
              >
                <SvgIcon icon="more-vertical" size={20} />
              </Button>
            </ContextMenu.Trigger>

            <ContextMenu.Content>
              {isModel ? (
                <>
                  <ContextMenu.Link
                    href={`?action=edit-model&modelSlug=${(item as TreeItemModel).slug}`}
                    icon={<Edit2 size={14} />}
                  >
                    Edit
                  </ContextMenu.Link>
                  <ContextMenu.Link
                    href={`/editor/${(item as TreeItemModel).slug}`}
                    icon={<ExternalLink size={14} />}
                  >
                    {(item as TreeItemModel).is_singleton
                      ? "Edit Content"
                      : "View Records"}
                  </ContextMenu.Link>
                  <ContextMenu.Link
                    href={`?action=duplicate-model&modelSlug=${(item as TreeItemModel).slug}`}
                    icon={<Copy size={14} />}
                  >
                    Duplicate
                  </ContextMenu.Link>
                  <ContextMenu.Item
                    onSelect={() =>
                      onDelete((item as TreeItemModel).table_name)
                    }
                    variant="danger"
                    icon={<Trash2 size={14} />}
                  >
                    Delete
                  </ContextMenu.Item>
                </>
              ) : (
                <>
                  <ContextMenu.Link
                    href={`?action=edit-group&groupId=${item.id}`}
                    icon={<Edit2 size={14} />}
                  >
                    Edit Group
                  </ContextMenu.Link>
                  <ContextMenu.Item
                    onSelect={() => onDeleteGroup?.(item.id)}
                    variant="danger"
                    icon={<Trash2 size={14} />}
                  >
                    Delete Group
                  </ContextMenu.Item>
                </>
              )}
            </ContextMenu.Content>
          </ContextMenu>
        </div>
      </div>
    </li>
  )
}
