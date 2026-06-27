"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  DndContext,
  closestCenter,
  rectIntersection,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import Link from "next/link"
import clsx from "clsx"
import Button from "@/components/button"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/utils/supabase"
import { CMSField, CMSFieldset } from "@/types/fields"
import { SortableFieldCard } from "./sortable-field-card"
import { SortableFieldsetCard } from "./sortable-fieldset-card"
import FieldModal from "../field-modal"
import FieldsetModal from "../fieldset-modal"
import AlertDialog from "@/components/alert-dialog"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import s from "./style.module.css"

interface SortableFieldsetGroupProps {
  fieldset: CMSFieldset
  isOver: boolean
  onEdit: (fs: CMSFieldset) => void
  onDelete: (fs: CMSFieldset) => void
  children: React.ReactNode
}

function SortableFieldsetGroup({
  fieldset,
  isOver,
  onEdit,
  onDelete,
  children,
}: SortableFieldsetGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldset.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        s.fieldsetGroup,
        isOver && s.isOver,
        isDragging && s.dragging
      )}
    >
      <SortableFieldsetCard
        fieldset={fieldset}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
      <div className={s.groupNestedFields}>{children}</div>
    </div>
  )
}

interface FieldListProps {
  modelId: string
}

/**
 * Manages the listing and creation of fields for a model.
 */
export default function FieldList({ modelId }: FieldListProps) {
  const { accessToken } = useAuth()
  const [fields, setFields] = useState<CMSField[]>([])
  const [fieldsets, setFieldsets] = useState<CMSFieldset[]>([])
  const [unregisteredCount, setUnregisteredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Modal states
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false)
  const [isFieldsetModalOpen, setIsFieldsetModalOpen] = useState(false)
  const [activeField, setActiveField] = useState<CMSField | null>(null)
  const [activeFieldset, setActiveFieldset] = useState<CMSFieldset | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const lastOverId = useRef<string | null>(null)
  const dragOverThrottleRef = useRef<number | null>(null)
  const [fieldModalMode, setFieldModalMode] = useState<
    "create" | "edit" | "duplicate"
  >("create")
  const [fieldsetModalMode, setFieldsetModalMode] = useState<"create" | "edit">(
    "create"
  )

  // Alert state
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string
    description: string
    onConfirm: () => void
  }>({
    title: "",
    description: "",
    onConfirm: () => {},
  })

  // Flattened hierarchical items for DND calculation
  const flattenedItems = useMemo(() => {
    const topLevel: Array<
      | { type: "fieldset"; data: CMSFieldset }
      | { type: "field"; data: CMSField }
    > = [
      ...fieldsets.map((fs) => ({ type: "fieldset" as const, data: fs })),
      ...fields
        .filter((f) => !f.fieldset_id)
        .map((f) => ({ type: "field" as const, data: f })),
    ]

    topLevel.sort((a, b) => {
      if (a.data.ui_order !== b.data.ui_order) {
        return a.data.ui_order - b.data.ui_order
      }
      return a.type === "fieldset" ? -1 : 1
    })

    const result: Array<
      | { type: "fieldset"; data: CMSFieldset }
      | { type: "field"; data: CMSField }
    > = []

    topLevel.forEach((item) => {
      result.push(item)
      if (item.type === "fieldset") {
        const nested = fields
          .filter((f) => f.fieldset_id === item.data.id)
          .sort((a, b) => a.ui_order - b.ui_order)
        nested.forEach((nf) => {
          result.push({ type: "field" as const, data: nf })
        })
      }
    })

    return result
  }, [fields, fieldsets])

  const interleavedItems = useMemo(() => {
    const items: Array<
      | { type: "fieldset"; data: CMSFieldset }
      | { type: "field"; data: CMSField }
    > = [
      ...fieldsets.map((fs) => ({
        type: "fieldset" as const,
        data: fs,
      })),
      ...fields
        .filter((f) => !f.fieldset_id)
        .map((f) => ({ type: "field" as const, data: f })),
    ]

    return items.sort((a, b) => {
      if (a.data.ui_order !== b.data.ui_order) {
        return a.data.ui_order - b.data.ui_order
      }
      return a.type === "fieldset" ? -1 : 1
    })
  }, [fields, fieldsets])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchFields = useCallback(async () => {
    if (!modelId) return

    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      // 1. Fetch registered fields
      const response = await fetch(
        `/api/models/schema/fields?model_id=${modelId}`,
        { headers }
      )
      if (!response.ok) throw new Error("Failed to fetch registered fields")
      const data = await response.json()

      // Filter out system-level fields from the management list
      const filteredFields = (data || []).filter(
        (f: CMSField) =>
          !["status", "_draft", "created_by", "updated_by"].includes(
            f.field_name
          )
      )
      setFields(filteredFields)

      // 1.5 Fetch Fieldsets
      const fsRes = await fetch(
        `/api/models/schema/fieldsets?model_id=${modelId}`,
        { headers }
      )
      if (fsRes.ok) {
        const fsData = await fsRes.json()
        setFieldsets(fsData || [])
      }

      // 2. Resolve table name to check for unregistered columns
      const supabase = createClient()
      const { data: modelData } = await supabase
        .from("models")
        .select("table_name")
        .eq("id", modelId)
        .single()

      if (modelData) {
        // Fetch physical columns (requires auth)
        const schemaRes = await fetch(
          `/api/models/schema?table=${modelData.table_name}`,
          { headers }
        )
        if (schemaRes.ok) {
          const physicalCols = (await schemaRes.json()) as Array<{
            column_name: string
          }>
          const registeredNames = new Set(
            data.map((f: CMSField) => f.field_name)
          )
          const systemFields = [
            "id",
            "created_at",
            "updated_at",
            "status",
            "_draft",
            "created_by",
            "updated_by",
          ]
          const missing = physicalCols.filter(
            (c) =>
              !registeredNames.has(c.column_name) &&
              !systemFields.includes(c.column_name)
          )
          setUnregisteredCount(missing.length)
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }, [modelId, accessToken])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFields()
    }, 0)

    // Listen for schema-update events from the SchemaModal
    const handleSchemaUpdate = () => {
      fetchFields()
    }
    window.addEventListener("schema-update", handleSchemaUpdate)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("schema-update", handleSchemaUpdate)
    }
  }, [fetchFields, accessToken])

  const handleSync = async () => {
    if (!accessToken || !modelId) return
    setIsSyncing(true)
    try {
      const supabase = createClient()
      const { data: modelData } = await supabase
        .from("models")
        .select("table_name")
        .eq("id", modelId)
        .single()

      if (!modelData) throw new Error("Could not resolve table name")

      const response = await fetch("/api/models/schema/fields/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          model_id: modelId,
          table_name: modelData.table_name,
        }),
      })

      if (!response.ok) throw new Error("Failed to sync fields")
      await fetchFields()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sync fields")
    } finally {
      setIsSyncing(false)
    }
  }

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
    const activeField = fields.find((f) => f.id === activeId)
    if (!activeField) return

    // Determine target container
    const overField = fields.find((f) => f.id === overId)
    const overFieldset = fieldsets.find((fs) => fs.id === overId)

    const targetFieldsetId: string | null = overFieldset
      ? overFieldset.id
      : overField
        ? (overField.fieldset_id ?? null)
        : null

    // If container changed, update fields state
    if (activeField.fieldset_id !== targetFieldsetId) {
      // Immediate update for container changes to ensure persistence logic in DragEnd sees the right state
      setFields((prev) => {
        const currentActive = prev.find((f) => f.id === activeId)
        if (currentActive?.fieldset_id === targetFieldsetId) return prev

        const next = [...prev]
        const idx = next.findIndex((f) => f.id === activeId)
        if (idx !== -1) {
          next[idx] = { ...next[idx], fieldset_id: targetFieldsetId }
        }
        return next
      })

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

    // Find the item being dragged
    const activeField = fields.find((f) => f.id === activeId)
    const activeFieldset = fieldsets.find((fs) => fs.id === activeId)

    // Find what it was dropped over
    const overField = fields.find((f) => f.id === overId)
    const overFieldset = fieldsets.find((fs) => fs.id === overId)

    // Use the latest fields state which already has the updated fieldset_id from handleDragOver
    const nextFields = [...fields]
    const nextFieldsets = [...fieldsets]

    // Unified reorder calculation using flattened list
    const oldIdx = flattenedItems.findIndex((i) =>
      i.type === "field" ? i.data.id === activeId : i.data.id === activeId
    )
    const newIdx = flattenedItems.findIndex((i) =>
      i.type === "field" ? i.data.id === overId : i.data.id === overId
    )

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

    setFields(nextFields)
    setFieldsets(nextFieldsets)

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
      fetchFields()
    }
  }

  const handleDeleteFieldset = async (fieldset: CMSFieldset) => {
    if (!accessToken) return
    setAlertConfig({
      title: "Delete Field Group?",
      description: `Are you sure you want to delete "${fieldset.label}"? Any fields inside this group will be moved to the ungrouped section. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(
            `/api/models/schema/fieldsets?id=${fieldset.id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          )
          if (!res.ok) throw new Error("Failed to delete fieldset")
          setIsAlertOpen(false)
          fetchFields()
        } catch (err: unknown) {
          setError(
            err instanceof Error ? err.message : "Failed to delete fieldset"
          )
        }
      },
    })
    setIsAlertOpen(true)
  }

  const handleDelete = async (field: CMSField) => {
    if (!accessToken) return
    if (
      !window.confirm(
        `Are you sure you want to delete the field "${field.field_label}"? This will permanently drop the database column.`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/models/schema/fields?id=${field.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to delete field")
      }

      await fetchFields()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete field")
    }
  }

  if (loading) return <p>Loading fields...</p>

  /**
   * Returns a category class for icon styling based on field type.
   */
  const getIconCategory = (type: string) => {
    if (type.includes("text")) return s.icon_text
    if (type.includes("media")) return s.icon_media
    if (type.includes("json")) return s.icon_json
    if (type.includes("seo")) return s.icon_seo
    if (type.includes("boolean")) return s.icon_boolean
    return s.icon_text
  }

  return (
    <div className={s.fieldListContainer}>
      <div className={s.header}>
        <div className={s.headerTitleGroup}>
          <h2>Model Fields & Groups</h2>
          {unregisteredCount > 0 && (
            <span className={s.syncHint}>
              {unregisteredCount} existing columns detected.
              <Button
                variant="secondary"
                size="small"
                onClick={handleSync}
                isLoading={isSyncing}
                disabled={isSyncing}
                className={s.syncButton}
              >
                Import them
              </Button>
            </span>
          )}
        </div>
        <div
          className={s.headerActions}
          style={{ display: "flex", gap: "8px" }}
        >
          <Button
            variant="secondary"
            beforeText={<span>+</span>}
            onClick={() => {
              setFieldsetModalMode("create")
              setActiveFieldset(null)
              setIsFieldsetModalOpen(true)
            }}
          >
            Add fieldset
          </Button>
          <Button
            beforeText={<span>+</span>}
            onClick={() => {
              setFieldModalMode("create")
              setActiveField(null)
              setIsFieldModalOpen(true)
            }}
          >
            Add new field
          </Button>
        </div>
      </div>

      {error && <p className={s.errorText}>{error}</p>}

      <div className={s.fieldStack}>
        {interleavedItems.length === 0 && !loading && (
          <p className={s.emptyState}>
            {`No fields or groups added yet. Click the buttons above to get started`}
            .
          </p>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={s.interleavedStack}>
            <SortableContext
              items={interleavedItems.map((i) => i.data.id)}
              strategy={verticalListSortingStrategy}
            >
              {interleavedItems.map((item) => {
                if (item.type === "fieldset") {
                  const fieldset = item.data
                  const fieldsInGroup = fields.filter(
                    (f) => f.fieldset_id === fieldset.id
                  )
                  return (
                    <SortableFieldsetGroup
                      key={fieldset.id}
                      fieldset={fieldset}
                      isOver={overId === fieldset.id}
                      onEdit={(fs) => {
                        setActiveFieldset(fs)
                        setFieldsetModalMode("edit")
                        setIsFieldsetModalOpen(true)
                      }}
                      onDelete={handleDeleteFieldset}
                    >
                      <SortableContext
                        items={fieldsInGroup.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {fieldsInGroup.map((field) => (
                          <SortableFieldCard
                            key={field.id}
                            field={field}
                            getIconCategory={getIconCategory}
                            onEdit={(field) => {
                              setActiveField(field)
                              setFieldModalMode("edit")
                              setIsFieldModalOpen(true)
                            }}
                            onDuplicate={(field) => {
                              setActiveField(field)
                              setFieldModalMode("duplicate")
                              setIsFieldModalOpen(true)
                            }}
                            onDelete={handleDelete}
                          />
                        ))}
                      </SortableContext>
                    </SortableFieldsetGroup>
                  )
                } else {
                  const field = item.data
                  return (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                      getIconCategory={getIconCategory}
                      onEdit={(field) => {
                        setActiveField(field)
                        setFieldModalMode("edit")
                        setIsFieldModalOpen(true)
                      }}
                      onDuplicate={(field) => {
                        setActiveField(field)
                        setFieldModalMode("duplicate")
                        setIsFieldModalOpen(true)
                      }}
                      onDelete={handleDelete}
                    />
                  )
                }
              })}
            </SortableContext>
          </div>
          <DragOverlay adjustScale={false}>
            {draggingId ? (
              <div className={s.draggingOverlay}>
                {(() => {
                  const field = fields.find((f) => f.id === draggingId)
                  const fieldset = fieldsets.find((fs) => fs.id === draggingId)
                  if (field) {
                    return (
                      <SortableFieldCard
                        field={field}
                        getIconCategory={getIconCategory}
                        onEdit={() => {}}
                        onDuplicate={() => {}}
                        onDelete={() => {}}
                        isDragging
                      />
                    )
                  }
                  if (fieldset) {
                    return (
                      <SortableFieldsetCard
                        fieldset={fieldset}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        isDragging
                      />
                    )
                  }
                  return null
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <FieldModal
        isOpen={isFieldModalOpen}
        onOpenChange={setIsFieldModalOpen}
        onSuccess={fetchFields}
        modelId={modelId}
        accessToken={accessToken}
        field={activeField}
        mode={fieldModalMode}
        fieldsets={fieldsets}
      />

      <FieldsetModal
        isOpen={isFieldsetModalOpen}
        onOpenChange={setIsFieldsetModalOpen}
        onSuccess={fetchFields}
        modelId={modelId}
        accessToken={accessToken}
        fieldset={activeFieldset}
        mode={fieldsetModalMode}
      />

      <AlertDialog
        isOpen={isAlertOpen}
        onOpenChange={setIsAlertOpen}
        title={alertConfig.title}
        description={alertConfig.description}
        onConfirm={alertConfig.onConfirm}
        confirmVariant="danger"
        confirmText="Delete"
      />
    </div>
  )
}
