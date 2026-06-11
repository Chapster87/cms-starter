"use client"

import { useCallback, useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import Button from "@/components/button"
import { useModels, ModelRegistryEntry, ModelGroup } from "@/hooks/use-models"
import { toast } from "@/client/toast-store"
import { useAuth } from "@/hooks/use-auth"
import { useTreeDnd } from "@/hooks/use-tree-dnd"
import { INDENTATION_WIDTH, flattenTree } from "@/helpers/tree-helpers"
import {
  buildTree,
  TreeItem,
  TreeItemModel,
  FlattenedTreeItem,
} from "../../_helpers/model-tree-helpers"
import ModelItemRow from "./model-item-row"
import { FolderPlus } from "lucide-react"
import s from "./style.module.css"

interface ModelListProps {
  models: ModelRegistryEntry[]
  groups: ModelGroup[]
}

/**
 * Renders a list of models (Supabase tables) organized by groups with DND reordering.
 */
export default function ModelList({ models, groups }: ModelListProps) {
  const { deleteModel, refresh } = useModels()
  const { accessToken } = useAuth()
  const params = useParams()
  const activeModelSlug = params?.model as string | undefined

  const [items, setItems] = useState<TreeItem[]>([])
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(buildTree(models, groups))
    }, 0)
    return () => clearTimeout(timer)
  }, [models, groups])

  /**
   * Filter tree to only show items that are not within a collapsed group
   */
  const flattenedItems = useMemo(() => {
    const allFlat = flattenTree(items) as FlattenedTreeItem[]
    const visible: typeof allFlat = []

    allFlat.forEach((item: FlattenedTreeItem) => {
      // Check if any ancestor is collapsed
      let isHidden = false
      let currentParentId = item.parentId
      while (currentParentId) {
        if (collapsedIds.has(currentParentId)) {
          isHidden = true
          break
        }
        // Find parent's parent
        const parent = allFlat.find(
          (p: FlattenedTreeItem) => p.id === currentParentId
        )
        currentParentId = parent?.parentId || null
      }

      if (!isHidden) {
        visible.push(item)
      }
    })

    return visible
  }, [items, collapsedIds])

  const toggleGroup = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const {
    activeId,
    overId,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    getProjectedDepth,
  } = useTreeDnd({
    flattenedItems,
    onDragEnd: async ({ activeId, newParentId, activeIndex, overIndex }) => {
      // Prepare update payload
      // 1. Move item in the flat list
      const newFlat = [...flattenedItems]
      const [movedItem] = newFlat.splice(activeIndex, 1)
      newFlat.splice(overIndex, 0, movedItem)

      // 2. Map to final DB items
      const updatePayload = newFlat.map((item, index) => {
        const isMovedItem = item.id === activeId
        const finalGroupId = isMovedItem ? newParentId : item.parentId

        return {
          id: item.id,
          type: item.type,
          display_order: index,
          group_id: item.type === "model" ? finalGroupId : undefined,
        }
      })

      try {
        await fetch("/api/models/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ items: updatePayload }),
        })
        refresh()
      } catch (err) {
        console.error("Failed to persist reorder:", err)
        refresh()
      }
    },
  })

  const handleDeleteModel = useCallback(
    async (modelName: string) => {
      if (
        !window.confirm(
          `Are you sure you want to delete the model '${modelName}' and all its records?`
        )
      ) {
        return
      }

      try {
        await deleteModel(modelName)
        toast.success("Model deleted")
      } catch (err: unknown) {
        toast.error(
          "Delete failed",
          err instanceof Error ? err.message : "Failed to delete model."
        )
      }
    },
    [deleteModel]
  )

  const handleDeleteGroup = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "Are you sure you want to delete this group? Models will be moved to the top level."
        )
      )
        return
      try {
        await fetch(`/api/models/groups?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        refresh()
        toast.success("Group deleted")
      } catch (err) {
        toast.error("Delete failed", "Failed to delete group")
      }
    },
    [accessToken, refresh]
  )

  return (
    <div className={s.modelListContainer}>
      {items.length === 0 ? (
        <p>No models found. Create a new one!</p>
      ) : (
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
            items={flattenedItems.map((i: FlattenedTreeItem) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className={s.modelList}>
              {flattenedItems.map((fItem: FlattenedTreeItem) => {
                return (
                  <ModelItemRow
                    key={fItem.id}
                    item={fItem}
                    depth={getProjectedDepth(fItem.id, fItem.depth)}
                    isActive={
                      fItem.type === "model" &&
                      activeModelSlug === (fItem as TreeItemModel).slug
                    }
                    isExpanded={!collapsedIds.has(fItem.id)}
                    onToggle={() => toggleGroup(fItem.id)}
                    onDelete={handleDeleteModel}
                    onDeleteGroup={handleDeleteGroup}
                  />
                )
              })}
            </ul>
          </SortableContext>
          <DragOverlay adjustScale={false}>
            {activeId ? (
              <ModelItemRow
                item={
                  flattenedItems.find(
                    (i: FlattenedTreeItem) => i.id === activeId
                  ) as TreeItem
                }
                depth={getProjectedDepth(
                  activeId,
                  flattenedItems.find(
                    (i: FlattenedTreeItem) => i.id === activeId
                  )!.depth
                )}
                isActive={false}
                onDelete={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      <div className={s.footer}>
        <div className={s.footerActions}>
          <Link href="?action=new-model">
            <Button beforeText="+">New Model</Button>
          </Link>
          <Link href="?action=new-group">
            <Button variant="secondary" beforeText={<FolderPlus size={16} />}>
              Add Group
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
