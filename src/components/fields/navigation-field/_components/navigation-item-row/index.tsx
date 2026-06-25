import React, { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Menu,
  ExternalLink,
  Link2,
  Route,
  ChevronRight,
  ChevronDown,
  Edit2,
  Copy,
  Trash2,
  Plus,
} from "lucide-react"
import { NavigationItem } from "@/types/cms-generated"
import Button from "@/components/button"
import ContextMenu from "@/components/context-menu"
import SvgIcon from "@/components/svg-icon"
import { RecordPreview } from "../../_helpers/tree-helpers"
import GroupEditModal from "../group-edit-modal"
import ItemEditModal from "../item-edit-modal"
import s from "./style.module.css"

interface ItemRowProps {
  item: NavigationItem
  previews: Record<string, RecordPreview>
  overId: string | null
  allowedModels: string[]
  onChange: (item: Partial<NavigationItem>) => void
  onDelete: () => void
  onAddAfter: (newItem: NavigationItem) => void
  onAddSubItem?: (newItem: NavigationItem) => void
  depth?: number
  isOver?: boolean
  isDragging?: boolean
  isOverlay?: boolean
}

/**
 * A single row in the navigation field, representing a link or group.
 * Handles sortable logic, drag handles, and hierarchical display.
 */
export default function NavigationItemRow({
  item,
  previews,
  allowedModels,
  onChange,
  onDelete,
  onAddAfter,
  onAddSubItem,
  depth = 0,
  isOver,
  isDragging: parentIsDragging,
  isOverlay,
}: ItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver: sortableIsOver,
  } = useSortable({ id: item.id, disabled: isOverlay })

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const effectiveIsOver = isOver ?? sortableIsOver
  const effectiveIsDragging = isDragging || parentIsDragging

  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false)

  /**
   * Creates a duplicate of the current item with new IDs.
   */
  const handleDuplicate = () => {
    const newItem: NavigationItem = {
      ...item,
      id: crypto.randomUUID(),
      labelOverride: item.labelOverride
        ? `${item.labelOverride} (Copy)`
        : undefined,
      children: item.children?.map((child) => ({
        ...child,
        id: crypto.randomUUID(),
      })),
    }
    onAddAfter(newItem)
  }

  /**
   * Resolves the display label for the item based on its type and metadata.
   */
  const getLabel = () => {
    if (item.labelOverride) return item.labelOverride
    if (item.type === "group") return "Navigation Group"
    if (item.type === "internal") {
      const preview = item.linkedRecord?.id
        ? previews[item.linkedRecord.id]
        : null
      return (
        preview?.display_name ||
        item.linkedRecord?.displayName ||
        "Untitled Link"
      )
    }
    if (item.type === "external") return item.url || "Untitled External"
    if (item.type === "static") return item.routePath || "Untitled Route"
    return "Menu Item"
  }

  /**
   * Returns the appropriate icon for the item type.
   */
  const getTypeIcon = () => {
    switch (item.type) {
      case "group":
        return <Menu size={14} />
      case "internal":
        return <Link2 size={14} />
      case "external":
        return <ExternalLink size={14} />
      case "static":
        return <Route size={14} />
      default:
        return <Link2 size={14} />
    }
  }

  const hasSubItems = item.children && item.children.length > 0

  return (
    <div
      ref={setNodeRef}
      style={{ ...dndStyle, marginLeft: `${depth * 24}px` }}
      className={`${s.rowWrapper} ${effectiveIsOver ? s.isOver : ""} ${
        effectiveIsDragging ? s.isDragging : ""
      } ${isOverlay ? s.isOverlay : ""}`}
    >
      <div
        className={`${s.itemRow} ${effectiveIsOver ? s.dropTarget : ""} ${
          effectiveIsDragging ? s.placeholder : ""
        }`}
      >
        <div className={s.dragHandle} {...attributes} {...listeners}>
          <SvgIcon icon="menu" size={16} />
        </div>

        {hasSubItems && (
          <Button
            variant="secondary"
            unstyled
            type="button"
            className={s.expandBtn}
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </Button>
        )}

        <div className={s.itemIcon}>{getTypeIcon()}</div>

        <div
          className={s.itemMain}
          onClick={() => {
            if (item.type === "group") {
              setIsGroupModalOpen(true)
            } else {
              setIsEditModalOpen(true)
            }
          }}
        >
          <div className={s.itemLabel}>{getLabel()}</div>
          <div className={s.itemMeta}>
            {item.type === "group" && (
              <span>
                Group{hasSubItems ? ` (${item.children?.length} items)` : ""}
              </span>
            )}
            {item.type === "internal" && item.linkedRecord && (
              <span>
                Path: /
                {previews[item.linkedRecord.id]?.subtitle ||
                  item.linkedRecord.slug ||
                  item.linkedRecord.id}
              </span>
            )}
            {item.type === "external" && item.url && (
              <span>URL: {item.url}</span>
            )}
            {item.type === "static" && item.routePath && (
              <span>Route: {item.routePath}</span>
            )}
            {item.type !== "group" && hasSubItems && (
              <span> • {item.children?.length} submenu item(s)</span>
            )}
          </div>
        </div>

        <div className={s.actions}>
          {item.type === "group" && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              className={s.addSubItemBtn}
              onClick={(e) => {
                e.stopPropagation()
                setIsAddSubModalOpen(true)
              }}
              title="Add sub-item"
            >
              <Plus size={16} />
            </Button>
          )}
          <ContextMenu>
            <ContextMenu.Trigger className={s.actionBtn} />
            <ContextMenu.Content>
              <ContextMenu.Item
                icon={<Edit2 size={14} />}
                onSelect={() => {
                  if (item.type === "group") {
                    setIsGroupModalOpen(true)
                  } else {
                    setIsEditModalOpen(true)
                  }
                }}
              >
                Edit
              </ContextMenu.Item>
              <ContextMenu.Item
                icon={<Plus size={14} />}
                onSelect={() => setIsAddSubModalOpen(true)}
              >
                Add sub-item
              </ContextMenu.Item>
              <ContextMenu.Item
                icon={<Copy size={14} />}
                onSelect={handleDuplicate}
              >
                Duplicate
              </ContextMenu.Item>
              <ContextMenu.Item
                variant="danger"
                icon={<Trash2 size={14} />}
                onSelect={() => onDelete()}
              >
                Remove
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu>
        </div>

        {isEditModalOpen && (
          <ItemEditModal
            isOpen={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            item={item}
            onSave={(updated) => {
              onChange(updated)
              setIsEditModalOpen(false)
            }}
            allowedModels={allowedModels}
          />
        )}

        {isGroupModalOpen && (
          <GroupEditModal
            isOpen={isGroupModalOpen}
            onOpenChange={setIsGroupModalOpen}
            item={item}
            onSave={(updated) => {
              onChange(updated)
              setIsGroupModalOpen(false)
            }}
          />
        )}

        {isAddSubModalOpen && (
          <ItemEditModal
            isOpen={isAddSubModalOpen}
            onOpenChange={setIsAddSubModalOpen}
            item={{
              id: crypto.randomUUID(),
              type: "internal",
              children: [],
            }}
            onSave={(newSub) => {
              if (onAddSubItem) {
                onAddSubItem(newSub)
              } else {
                onChange({
                  ...item,
                  children: [...(item.children || []), newSub],
                })
              }
              setIsAddSubModalOpen(false)
            }}
            allowedModels={allowedModels}
            isNew
          />
        )}
      </div>
    </div>
  )
}
