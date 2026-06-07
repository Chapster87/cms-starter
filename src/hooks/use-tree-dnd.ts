import { useState, useCallback } from "react"
import {
  DragStartEvent,
  DragMoveEvent,
  DragOverEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import {
  FlattenedItem,
  getProjection,
  INDENTATION_WIDTH,
  TreeItem,
} from "@/helpers/tree-helpers"

interface UseTreeDndProps<T extends TreeItem> {
  flattenedItems: FlattenedItem<T>[]
  indentationWidth?: number
  onDragEnd: (event: {
    activeId: string
    overId: string
    newDepth: number
    newParentId: string | null
    activeIndex: number
    overIndex: number
  }) => void | Promise<void>
}

/**
 * A reusable hook for handling tree-based drag and drop with indentation-based nesting.
 */
export function useTreeDnd<T extends TreeItem>({
  flattenedItems,
  indentationWidth = INDENTATION_WIDTH,
  onDragEnd: onDragEndProp,
}: UseTreeDndProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [offsetLeft, setOffsetLeft] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
    setOverId(active.id as string)
    setOffsetLeft(0)
    document.body.classList.add("dragging")
  }, [])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    setOffsetLeft(event.delta.x)
  }, [])

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    setOverId((over?.id as string) ?? null)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      const finalActiveId = active.id as string
      const finalOverId = over?.id as string

      document.body.classList.remove("dragging")

      if (finalOverId && finalActiveId !== finalOverId) {
        const activeIndex = flattenedItems.findIndex(
          (i) => i.id === finalActiveId
        )
        const overIndex = flattenedItems.findIndex((i) => i.id === finalOverId)

        if (activeIndex !== -1 && overIndex !== -1) {
          const { depth, parentId } = getProjection<T>(
            flattenedItems,
            finalActiveId,
            finalOverId,
            offsetLeft,
            indentationWidth
          )

          await onDragEndProp({
            activeId: finalActiveId,
            overId: finalOverId,
            newDepth: depth,
            newParentId: parentId,
            activeIndex,
            overIndex,
          })
        }
      }

      setActiveId(null)
      setOverId(null)
      setOffsetLeft(0)
    },
    [flattenedItems, offsetLeft, indentationWidth, onDragEndProp]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverId(null)
    setOffsetLeft(0)
    document.body.classList.remove("dragging")
  }, [])

  /**
   * Calculates the projected depth for a given item during drag.
   * Useful for rendering the indentation guides/placeholders in real-time.
   */
  const getProjectedDepth = useCallback(
    (itemId: string, currentDepth: number) => {
      if (activeId !== itemId) return currentDepth

      const { depth } = getProjection<T>(
        flattenedItems,
        activeId,
        overId || itemId,
        offsetLeft,
        indentationWidth
      )
      return depth
    },
    [activeId, overId, offsetLeft, flattenedItems, indentationWidth]
  )

  return {
    activeId,
    overId,
    offsetLeft,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    getProjectedDepth,
  }
}
