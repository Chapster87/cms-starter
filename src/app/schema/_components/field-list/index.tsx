"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { DndContext, closestCorners, DragOverlay } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/utils/supabase"
import { CMSField, CMSFieldset } from "@/types/fields"
import { useDndSensors } from "@/hooks/use-dnd-sensors"
import { SortableFieldCard } from "./_components/sortable-field-card"
import { SortableFieldsetCard } from "./_components/sortable-fieldset-card"
import FieldModal from "../field-modal"
import FieldsetModal from "../fieldset-modal"
import AlertDialog from "@/components/alert-dialog"
import { useFieldDnd } from "./_hooks/use-field-dnd"
import { FieldListHeader } from "./_components/field-list-header"
import { FieldsetGroup } from "./_components/fieldset-group"
import s from "./style.module.css"

interface FieldListProps {
  modelId?: string
  blockId?: string
}

/**
 * Manages the listing and creation of fields for a model or block.
 * Orchestrates data fetching, drag-and-drop, and field management modals.
 */
export default function FieldList({ modelId, blockId }: FieldListProps) {
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

  const sensors = useDndSensors()

  const fetchFields = useCallback(async () => {
    if (!modelId && !blockId) return

    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      // 1. Fetch registered fields
      const url = blockId
        ? `/api/blocks/fields?blockId=${blockId}`
        : `/api/models/schema/fields?model_id=${modelId}`

      const response = await fetch(url, { headers })
      if (!response.ok) throw new Error("Failed to fetch registered fields")
      const data = await response.json()

      // Filter out system-level fields from the management list
      const filteredFields = (data || []).filter(
        (f: CMSField) =>
          !["status", "_draft", "created_by", "updated_by"].includes(f.slug)
      )
      setFields(filteredFields)

      // 1.5 Fetch Fieldsets (Only for models, blocks don't support fieldsets yet)
      if (modelId) {
        const fsRes = await fetch(
          `/api/models/schema/fieldsets?model_id=${modelId}`,
          { headers }
        )
        if (fsRes.ok) {
          const fsData = await fsRes.json()
          setFieldsets(fsData || [])
        }
      }

      // 2. Resolve table name to check for unregistered columns (Only for models)
      if (modelId) {
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
            const registeredNames = new Set(data.map((f: CMSField) => f.slug))
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
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }, [modelId, blockId, accessToken])

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

  const { draggingId, overId, handleDragStart, handleDragOver, handleDragEnd } =
    useFieldDnd({
      fields,
      fieldsets,
      flattenedItems,
      accessToken,
      onFieldsChange: setFields,
      onFieldsetsChange: setFieldsets,
      onRefresh: fetchFields,
    })

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
      <FieldListHeader
        unregisteredCount={unregisteredCount}
        isSyncing={isSyncing}
        onSync={handleSync}
        onAddFieldset={() => {
          setFieldsetModalMode("create")
          setActiveFieldset(null)
          setIsFieldsetModalOpen(true)
        }}
        onAddNewField={() => {
          setFieldModalMode("create")
          setActiveField(null)
          setIsFieldModalOpen(true)
        }}
      />

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
                  return (
                    <FieldsetGroup
                      key={fieldset.id}
                      fieldset={fieldset}
                      fields={fields}
                      isOver={overId === fieldset.id}
                      onEditFieldset={(fs) => {
                        setActiveFieldset(fs)
                        setFieldsetModalMode("edit")
                        setIsFieldsetModalOpen(true)
                      }}
                      onDeleteFieldset={handleDeleteFieldset}
                      onEditField={(field) => {
                        setActiveField(field)
                        setFieldModalMode("edit")
                        setIsFieldModalOpen(true)
                      }}
                      onDuplicateField={(field) => {
                        setActiveField(field)
                        setFieldModalMode("duplicate")
                        setIsFieldModalOpen(true)
                      }}
                      onDeleteField={handleDelete}
                      getIconCategory={getIconCategory}
                    />
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
        modelId={modelId || ""}
        blockId={blockId}
        accessToken={accessToken}
        field={activeField}
        mode={fieldModalMode}
        fieldsets={fieldsets}
      />

      <FieldsetModal
        isOpen={isFieldsetModalOpen}
        onOpenChange={setIsFieldsetModalOpen}
        onSuccess={fetchFields}
        modelId={modelId || ""}
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
