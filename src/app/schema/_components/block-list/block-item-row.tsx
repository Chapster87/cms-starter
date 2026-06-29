"use client"

import React from "react"
import Link from "next/link"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react"
import clsx from "clsx"

import Button from "@/components/button"
import ContextMenu from "@/components/context-menu"
import SvgIcon from "@/components/svg-icon"
import {
  TreeItem,
  TreeItemBlock,
  TreeItemGroup,
} from "../../_helpers/block-tree-helpers"
import { CMSBlock } from "@/types/fields"
import s from "./style.module.css"

interface BlockItemRowProps {
  item: TreeItem
  depth: number
  isActive: boolean
  isExpanded?: boolean
  onToggle?: () => void
  onDelete: (block: CMSBlock) => void
  onDeleteGroup?: (id: string) => void
  isOverlay?: boolean
}

/**
 * A single row in the block list sidebar.
 */
export default function BlockItemRow({
  item,
  depth,
  isActive,
  isExpanded = true,
  onToggle,
  onDelete,
  onDeleteGroup,
  isOverlay,
}: BlockItemRowProps) {
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

  const isBlock = item.type === "block"

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clsx(
        s.itemRow,
        isActive && s.isActive,
        isDragging && s.dragging,
        isOverlay && s.overlay,
        isOver && s.isOver
      )}
    >
      {/* Indentation Guides */}
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
          {!isBlock && (
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
              {item.emoji || (isBlock ? "📦" : "📁")}
            </span>
          </div>

          <div className={s.itemContent}>
            {isBlock ? (
              <Link
                href={`/schema/block/${(item as TreeItemBlock).id}`}
                className={s.itemLink}
              >
                <div className={s.itemName}>
                  <span>{(item as TreeItemBlock).label}</span>
                </div>
                <code className={s.itemSlug}>
                  {(item as TreeItemBlock).api_id}
                </code>
              </Link>
            ) : (
              <div className={s.itemName}>
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
              {isBlock ? (
                <>
                  <ContextMenu.Link
                    href={`?action=edit-block&blockId=${item.id}`}
                    icon={<Edit2 size={14} />}
                  >
                    Edit Settings
                  </ContextMenu.Link>
                  <ContextMenu.Separator />
                  <ContextMenu.Item
                    variant="danger"
                    onSelect={() => onDelete(item as CMSBlock)}
                    icon={<Trash2 size={14} />}
                  >
                    Delete Block
                  </ContextMenu.Item>
                </>
              ) : (
                <>
                  <ContextMenu.Link
                    href={`?action=edit-block-group&blockGroupId=${item.id}`}
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
