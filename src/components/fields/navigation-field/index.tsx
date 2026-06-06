"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  DragMoveEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Menu, Plus, FolderPlus } from "lucide-react"
import Button from "@/components/button"
import { NavigationData, NavigationItem } from "@/types/navigation"
import { useAuth } from "@/hooks/use-auth"
import FieldWrapper from "../field-wrapper"
import NavigationItemRow from "./_components/navigation-item-row"
import ItemEditModal from "./_components/item-edit-modal"
import GroupEditModal from "./_components/group-edit-modal"
import {
  flattenTree,
  findItem,
  removeItem,
  insertItem,
  updateItemInTree,
  deleteItemFromTree,
  addItemToTree,
  addSubItemToTree,
  RecordPreview,
  INDENTATION_WIDTH,
} from "./_helpers/tree-helpers"
import s from "./style.module.css"

interface NavigationFieldProps {
  label: string
  value: NavigationData | null
  onChange: (value: NavigationData | null) => void
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
  settings?: Record<string, unknown>
}

type NewItemConfig = {
  type: NavigationItem["type"]
  parentPath: string[] | null
  insertIndex: number | null
}

/**
 * A professional navigation field for managing hierarchical menus.
 * Orchestrates the drag-and-drop system and state management.
 */
export default function NavigationField({
  label,
  value,
  onChange,
  description,
  fieldNote,
  required,
  disabled,
  settings,
}: NavigationFieldProps) {
  const { accessToken } = useAuth()
  const id = React.useId()
  const items = useMemo(() => value || [], [value])
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [newItemConfig, setNewItemConfig] = useState<NewItemConfig | null>(null)
  const [previews, setPreviews] = useState<Record<string, RecordPreview>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [offsetLeft, setOffsetLeft] = useState(0)

  const allowedModels = (settings?.allowed_models as string[]) || []

  // Extract all linked record IDs to fetch previews
  const linkedIds = useMemo(() => {
    const ids: string[] = []
    const collect = (list: NavigationItem[]) => {
      list.forEach((item) => {
        if (item.type === "internal" && item.linkedRecord?.id) {
          ids.push(item.linkedRecord.id)
        }
        if (item.children) collect(item.children)
      })
    }
    collect(items)
    return Array.from(new Set(ids))
  }, [items])

  // Fetch previews for all linked records
  useEffect(() => {
    const fetchPreviews = async () => {
      if (!accessToken || linkedIds.length === 0) return

      try {
        const response = await fetch(`/api/records/previews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ ids: linkedIds }),
        })
        if (response.ok) {
          const data: RecordPreview[] = await response.json()
          const nextPreviews: Record<string, RecordPreview> = {}
          data.forEach((p) => (nextPreviews[p.id] = p))
          setPreviews(nextPreviews)
        }
      } catch (err) {
        console.error("Error fetching navigation previews:", err)
      }
    }
    fetchPreviews()
  }, [accessToken, linkedIds])

  // Sensors for DND
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const flattenedItems = useMemo(() => flattenTree(items), [items])

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
    setOverId(active.id as string)
    setOffsetLeft(0)
    document.body.classList.add("dragging")
  }

  const handleDragMove = (event: DragMoveEvent) => {
    setOffsetLeft(event.delta.x)
  }

  const handleDragOver = ({ over }: DragOverEvent) => {
    const id = (over?.id as string) ?? null
    setOverId(id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    resetState()
    document.body.classList.remove("dragging")

    if (!over || active.id === over.id) return

    const activeIndex = flattenedItems.findIndex((i) => i.id === active.id)
    const overIndex = flattenedItems.findIndex((i) => i.id === over.id)
    const activeItem = flattenedItems[activeIndex]
    const overItem = flattenedItems[overIndex]

    if (!activeItem || !overItem) return

    const projectedDepth =
      activeItem.depth + Math.round(delta.x / INDENTATION_WIDTH)
    const prevItem = flattenedItems[overIndex]
    const maxDepth = prevItem ? prevItem.depth + 1 : 0
    const newDepth = Math.max(0, Math.min(projectedDepth, maxDepth))

    const nextItems = JSON.parse(JSON.stringify(items))
    const sourceItem = findItem(items, active.id as string)
    if (!sourceItem) return

    const itemToMove = JSON.parse(JSON.stringify(sourceItem))
    removeItem(nextItems, active.id as string)
    insertItem(
      nextItems,
      over.id as string,
      itemToMove,
      activeIndex < overIndex,
      newDepth,
      overItem
    )

    onChange(nextItems)
  }

  const handleDragCancel = () => {
    resetState()
    document.body.classList.remove("dragging")
  }

  const resetState = () => {
    setActiveId(null)
    setOverId(null)
    setOffsetLeft(0)
  }

  const handleOpenAddModal = (
    type: NavigationItem["type"],
    parentPath: string[] | null = null,
    insertIndex: number | null = null
  ) => {
    setNewItemConfig({ type, parentPath, insertIndex })
    if (type === "group") {
      setIsGroupModalOpen(true)
    } else {
      setIsNewModalOpen(true)
    }
  }

  const handleCreateItem = (item: NavigationItem) => {
    if (!newItemConfig) return

    if (newItemConfig.parentPath === null) {
      const nextItems = [...items]
      const index =
        newItemConfig.insertIndex !== null
          ? newItemConfig.insertIndex
          : nextItems.length
      nextItems.splice(index, 0, item)
      onChange(nextItems)
    }
    setIsNewModalOpen(false)
    setIsGroupModalOpen(false)
    setNewItemConfig(null)
  }

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <div className={s.navigationContainer}>
        {items.length > 0 ? (
          <div className={s.itemList}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={flattenedItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {flattenedItems.map((fItem, fIndex) => {
                  let projectedDepth = fItem.depth
                  if (activeId === fItem.id) {
                    const depthDelta = Math.round(
                      offsetLeft / INDENTATION_WIDTH
                    )
                    const prevItem = flattenedItems[fIndex - 1]
                    const maxDepth = prevItem ? prevItem.depth + 1 : 0
                    projectedDepth = Math.max(
                      0,
                      Math.min(fItem.depth + depthDelta, maxDepth)
                    )
                  }

                  return (
                    <NavigationItemRow
                      key={fItem.id}
                      item={fItem}
                      previews={previews}
                      overId={overId}
                      isOver={overId === fItem.id}
                      isDragging={activeId === fItem.id}
                      allowedModels={allowedModels}
                      depth={projectedDepth}
                      onChange={(updated) => {
                        const nextItems = JSON.parse(JSON.stringify(items))
                        updateItemInTree(nextItems, fItem.id, updated)
                        onChange(nextItems)
                      }}
                      onDelete={() => {
                        const nextItems = JSON.parse(JSON.stringify(items))
                        deleteItemFromTree(nextItems, fItem.id)
                        onChange(nextItems)
                      }}
                      onAddAfter={(newItem) => {
                        const nextItems = JSON.parse(JSON.stringify(items))
                        addItemToTree(nextItems, fItem.id, newItem, true)
                        onChange(nextItems)
                      }}
                      onAddSubItem={(newSub) => {
                        const nextItems = JSON.parse(JSON.stringify(items))
                        addSubItemToTree(nextItems, fItem.id, newSub)
                        onChange(nextItems)
                      }}
                    />
                  )
                })}
              </SortableContext>
              <DragOverlay adjustScale={false}>
                {activeId ? (
                  <div style={{ width: "100%" }}>
                    <NavigationItemRow
                      item={
                        flattenedItems.find(
                          (i) => i.id === activeId
                        ) as NavigationItem
                      }
                      previews={previews}
                      overId={null}
                      allowedModels={allowedModels}
                      depth={
                        (() => {
                          const fItem = flattenedItems.find(
                            (i) => i.id === activeId
                          )
                          if (!fItem) return 0
                          const fIndex = flattenedItems.findIndex(
                            (i) => i.id === activeId
                          )
                          const depthDelta = Math.round(
                            offsetLeft / INDENTATION_WIDTH
                          )
                          const prevItem = flattenedItems[fIndex - 1]
                          const maxDepth = prevItem ? prevItem.depth + 1 : 0
                          return Math.max(
                            0,
                            Math.min(fItem.depth + depthDelta, maxDepth)
                          )
                        })() || 0
                      }
                      onChange={() => {}}
                      onDelete={() => {}}
                      onAddAfter={() => {}}
                      isOverlay
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        ) : (
          <div className={s.emptyState}>
            <Menu size={24} className={s.emptyIcon} />
            <p>No navigation items yet</p>
          </div>
        )}

        <div className={s.addActions}>
          <Button
            type="button"
            variant="secondary"
            className={s.addBtn}
            onClick={() => handleOpenAddModal("internal")}
            disabled={disabled}
            beforeText={<Plus size={16} />}
          >
            Add Link
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={s.addBtn}
            onClick={() => handleOpenAddModal("group")}
            disabled={disabled}
            beforeText={<FolderPlus size={16} />}
          >
            Add Group
          </Button>
        </div>

        {isNewModalOpen && newItemConfig && (
          <ItemEditModal
            isOpen={isNewModalOpen}
            onOpenChange={setIsNewModalOpen}
            item={{
              id: crypto.randomUUID(),
              type: newItemConfig.type,
              children: [],
            }}
            onSave={handleCreateItem}
            allowedModels={allowedModels}
            isNew
          />
        )}

        {isGroupModalOpen && newItemConfig && (
          <GroupEditModal
            isOpen={isGroupModalOpen}
            onOpenChange={setIsGroupModalOpen}
            item={{
              id: crypto.randomUUID(),
              type: "group",
              children: [],
            }}
            onSave={handleCreateItem}
            isNew
          />
        )}
      </div>
    </FieldWrapper>
  )
}
