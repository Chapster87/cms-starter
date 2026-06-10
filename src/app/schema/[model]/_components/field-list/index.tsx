"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import Link from "next/link"
import Button from "@/components/button"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/utils/supabase"
import { CMSField } from "@/types/fields"
import { SortableFieldCard } from "./sortable-field-card"
import s from "./style.module.css"

interface FieldListProps {
  modelId: string
}

/**
 * Manages the listing and creation of fields for a model.
 */
export default function FieldList({ modelId }: FieldListProps) {
  const { accessToken } = useAuth()
  const [fields, setFields] = useState<CMSField[]>([])
  const [unregisteredCount, setUnregisteredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

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
        (f: CMSField) => !["status", "_draft"].includes(f.field_name)
      )
      setFields(filteredFields)

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)

      const newFields = arrayMove(fields, oldIndex, newIndex)
      setFields(newFields)

      // Update in database
      if (!accessToken) return

      try {
        const orders = newFields.map((f, index) => ({
          id: f.id,
          ui_order: index,
        }))

        const response = await fetch("/api/models/schema/fields/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orders }),
        })

        if (!response.ok) {
          throw new Error("Failed to save field order")
        }
      } catch (err: unknown) {
        console.error("Error reordering fields:", err)
        setError("Failed to save field order. Please try again.")
        // Revert UI on failure
        fetchFields()
      }
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

  return (
    <div className={s.fieldListContainer}>
      <div className={s.header}>
        <div className={s.headerTitleGroup}>
          <h2>Model Fields</h2>
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
        <Link href="?action=new-field">
          <Button beforeText={<span>+</span>}>Add new field</Button>
        </Link>
      </div>

      {error && <p className={s.errorText}>{error}</p>}

      <div className={s.fieldStack}>
        {fields.length === 0 && !loading && (
          <p className={s.emptyState}>
            {`No fields added yet. Click "+ Add new field" to get started`}.
          </p>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((field) => (
              <SortableFieldCard
                key={field.id}
                field={field}
                getIconCategory={getIconCategory}
                onEdit={(field) => {
                  const params = new URLSearchParams(window.location.search)
                  params.set("action", "edit-field")
                  params.set("fieldId", field.id)
                  window.history.pushState(null, "", `?${params.toString()}`)
                }}
                onDuplicate={(field) => {
                  const params = new URLSearchParams(window.location.search)
                  params.set("action", "duplicate-field")
                  params.set("fieldId", field.id)
                  window.history.pushState(null, "", `?${params.toString()}`)
                }}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
