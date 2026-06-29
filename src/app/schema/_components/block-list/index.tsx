"use client"

import { useCallback, useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import Button from "@/components/button"
import { useBlocks } from "@/hooks/use-blocks"
import { toast } from "@/client/toast-store"
import { useAuth } from "@/hooks/use-auth"
import { FolderPlus } from "lucide-react"
import { CMSBlock, CMSBlockGroup } from "@/types/fields"
import { useTreeDnd } from "@/hooks/use-tree-dnd"
import { flattenTree } from "@/helpers/tree-helpers"
import {
  buildTree,
  TreeItem,
  FlattenedTreeItem,
} from "../../_helpers/block-tree-helpers"
import BlockItemRow from "./block-item-row"
import s from "./style.module.css"

interface BlockListProps {
  blocks: CMSBlock[]
  groups: CMSBlockGroup[]
}

/**
 * Renders a list of blocks for the sidebar with DND support.
 */
export default function BlockList({ blocks, groups }: BlockListProps) {
  const { deleteBlock, refresh } = useBlocks()
  const { accessToken } = useAuth()
  const params = useParams()
  const activeBlockId = params?.blockId as string | undefined

  const [items, setItems] = useState<TreeItem[]>([])
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(buildTree(blocks, groups))
    }, 0)
    return () => clearTimeout(timer)
  }, [blocks, groups])

  const flattenedItems = useMemo(() => {
    const allFlat = flattenTree(items) as FlattenedTreeItem[]
    const visible: typeof allFlat = []

    allFlat.forEach((item: FlattenedTreeItem) => {
      let isHidden = false
      let currentParentId = item.parentId
      while (currentParentId) {
        if (collapsedIds.has(currentParentId)) {
          isHidden = true
          break
        }
        const parent = allFlat.find(
          (p: FlattenedTreeItem) => p.id === currentParentId
        )
        currentParentId = parent?.parentId || null
      }
      if (!isHidden) visible.push(item)
    })
    return visible
  }, [items, collapsedIds])

  const toggleGroup = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const {
    activeId,
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
      const newFlat = [...flattenedItems]
      const [movedItem] = newFlat.splice(activeIndex, 1)
      newFlat.splice(overIndex, 0, movedItem)

      const updatePayload = newFlat.map((item, index) => {
        const isMovedItem = item.id === activeId
        const finalGroupId = isMovedItem ? newParentId : item.parentId
        return {
          id: item.id,
          type: item.type,
          display_order: index,
          group_id: item.type === "block" ? finalGroupId : undefined,
        }
      })

      try {
        await fetch("/api/blocks/reorder", {
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

  const handleDelete = useCallback(
    async (block: CMSBlock) => {
      if (
        !window.confirm(
          `Are you sure you want to delete the block '${block.label}'?`
        )
      ) {
        return
      }

      try {
        await deleteBlock(block.id)
        toast.success("Block deleted")
      } catch (err: unknown) {
        toast.error(
          "Delete failed",
          err instanceof Error ? err.message : "Failed to delete block."
        )
      }
    },
    [deleteBlock]
  )

  const handleDeleteGroup = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "Are you sure you want to delete this group? Blocks will be moved to the top level."
        )
      )
        return
      try {
        await fetch(`/api/blocks/groups?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        refresh()
        toast.success("Group deleted")
      } catch (_err) {
        toast.error("Delete failed", "Failed to delete group")
      }
    },
    [accessToken, refresh]
  )

  return (
    <div className={s.blockListContainer}>
      {items.length === 0 ? (
        <p className={s.empty}>No blocks found. Create your first one!</p>
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
            <ul className={s.blockList}>
              {flattenedItems.map((fItem: FlattenedTreeItem) => (
                <BlockItemRow
                  key={fItem.id}
                  item={fItem as unknown as TreeItem}
                  depth={getProjectedDepth(fItem.id, fItem.depth)}
                  isActive={
                    fItem.type === "block" && activeBlockId === fItem.id
                  }
                  isExpanded={!collapsedIds.has(fItem.id)}
                  onToggle={() => toggleGroup(fItem.id)}
                  onDelete={handleDelete}
                  onDeleteGroup={handleDeleteGroup}
                />
              ))}
            </ul>
          </SortableContext>
          <DragOverlay adjustScale={false}>
            {activeId ? (
              <BlockItemRow
                item={
                  flattenedItems.find(
                    (i) => i.id === activeId
                  ) as unknown as TreeItem
                }
                depth={getProjectedDepth(
                  activeId,
                  flattenedItems.find((i) => i.id === activeId)!.depth
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
          <Link href="?action=new-block">
            <Button beforeText="+">New Block</Button>
          </Link>
          <Link href="?action=new-block-group">
            <Button variant="secondary" beforeText={<FolderPlus size={16} />}>
              Add Group
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
