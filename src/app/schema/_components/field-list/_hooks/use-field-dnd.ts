import { useEffect, useRef, useState } from "react"
import { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { CMSField, CMSFieldset } from "@/types/fields"

interface UseFieldDndProps {
  fields: CMSField[]
  fieldsets: CMSFieldset[]
  flattenedItems: Array<
    { type: "fieldset"; data: CMSFieldset } | { type: "field"; data: CMSField }
  >
  accessToken: string | null
  onFieldsChange: (fields: CMSField[]) => void
  onFieldsetsChange: (fieldsets: CMSFieldset[]) => void
  onRefresh: () => void
}

/**
 * Custom hook to handle drag-and-drop orchestration for the FieldList.
 * Manages dragging states, container switching logic, and API persistence.
 */
export function useFieldDnd({
  fields,
  fieldsets,
  flattenedItems,
  accessToken,
  onFieldsChange,
  onFieldsetsChange,
  onRefresh,
}: UseFieldDndProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const lastOverId = useRef<string | null>(null)
  const dragOverThrottleRef = useRef<number | null>(null)

  // Use a ref to store the latest fields state for access in event handlers
  // This avoids stale closures during the drag operation
  const fieldsRef = useRef<CMSField[]>(fields)
  useEffect(() => {
    fieldsRef.current = fields
  }, [fields])

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    const activeId = active.id as string
    const overId = over?.id as string

    if (!overId || activeId === overId) {
      setOverId(null)
      return
    }

    if (overId !== lastOverId.current) {
      setOverId(overId)
      lastOverId.current = overId
    }

    // Throttled container switching to prevent update loops
    if (dragOverThrottleRef.current) return

    // Find the containers
    const activeField = fieldsRef.current.find((f) => f.id === activeId)
    if (!activeField) return

    // Determine target container
    const overField = fieldsRef.current.find((f) => f.id === overId)
    const overFieldset = fieldsets.find((fs) => fs.id === overId)

    const targetFieldsetId: string | null = overFieldset
      ? overFieldset.id
      : overField
        ? (overField.fieldset_id ?? null)
        : null

    // If container changed, update fields state
    if (activeField.fieldset_id !== targetFieldsetId) {
      const nextFields = [...fieldsRef.current]
      const idx = nextFields.findIndex((f) => f.id === activeId)
      if (idx !== -1 && nextFields[idx].fieldset_id !== targetFieldsetId) {
        nextFields[idx] = { ...nextFields[idx], fieldset_id: targetFieldsetId }
        onFieldsChange(nextFields)
      }

      // Still throttle subsequent updates within this container to prevent layout thrashing
      dragOverThrottleRef.current = window.setTimeout(() => {
        dragOverThrottleRef.current = null
      }, 50)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setDraggingId(null)
    setOverId(null)
    if (dragOverThrottleRef.current) {
      window.clearTimeout(dragOverThrottleRef.current)
      dragOverThrottleRef.current = null
    }

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // CRITICAL: use the latest fields state which includes any fieldset_id changes from handleDragOver
    const nextFields = [...fieldsRef.current]
    const nextFieldsets = [...fieldsets]

    // Unified reorder calculation using flattened list
    const oldIdx = flattenedItems.findIndex((i) => i.data.id === activeId)
    const newIdx = flattenedItems.findIndex((i) => i.data.id === overId)

    if (oldIdx !== -1 && newIdx !== -1) {
      const newFlattened = arrayMove(flattenedItems, oldIdx, newIdx)
      newFlattened.forEach((item, index) => {
        if (item.type === "field") {
          const idx = nextFields.findIndex((f) => f.id === item.data.id)
          if (idx !== -1) nextFields[idx].ui_order = index
        } else {
          const idx = nextFieldsets.findIndex((fs) => fs.id === item.data.id)
          if (idx !== -1) nextFieldsets[idx].ui_order = index
        }
      })
    }

    onFieldsChange(nextFields)
    onFieldsetsChange(nextFieldsets)

    if (!accessToken) return

    try {
      const fieldOrders = nextFields.map((f) => ({
        id: f.id,
        ui_order: f.ui_order,
        fieldset_id: f.fieldset_id ?? null,
      }))
      const fieldsetOrders = nextFieldsets.map((fs) => ({
        id: fs.id,
        ui_order: fs.ui_order,
      }))

      await Promise.all([
        fetch("/api/models/schema/fields/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orders: fieldOrders }),
        }),
        fetch("/api/models/schema/fieldsets/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orders: fieldsetOrders }),
        }),
      ])
    } catch (err) {
      console.error("Failed to persist order:", err)
      onRefresh()
    }
  }

  return {
    draggingId,
    overId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  }
}
