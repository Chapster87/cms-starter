"use client"

import { useState, useEffect, useMemo } from "react"
import { CMSField, CMSFieldset } from "@/types/fields"
import { CMSModelMap, CMSModelName } from "@/types/cms-generated"
import { useAuth } from "@/hooks/use-auth"
import { useUsers } from "@/hooks/use-users"
import { createClient } from "@/utils/supabase"
import { FormCore, AuthorUser } from "../core/form-core"
import { FormCoreState } from "../core/types"

interface FieldSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface UseFormStateEngineProps<T extends CMSModelName> {
  id?: string
  model: T
  initialData?: Partial<CMSModelMap[T]>
  onAutoSave?: (data: Partial<CMSModelMap[T]>) => void
}

/**
 * Hook that connects the React UI to the FormCore engine.
 * Manages schema fetching, FormCore instantiation, and debounced auto-saving.
 */
export function useFormStateEngine<T extends CMSModelName>({
  id,
  model,
  initialData,
  onAutoSave,
}: UseFormStateEngineProps<T>) {
  const { accessToken } = useAuth()
  const { users } = useUsers()

  const [schema, setSchema] = useState<CMSField[]>([])
  const [fieldsets, setFieldsets] = useState<CMSFieldset[]>([])
  const [fetchingSchema, setFetchingSchema] = useState(true)

  // Internal state that tracks the FormCore state
  const [formState, setFormState] = useState<FormCoreState>({
    values: (initialData as Record<string, unknown>) || {},
    errors: {},
    isSubmitting: false,
    isDirty: false,
  })

  // Initialize FormCore instance. It's stable for a given model/id.
  const core = useMemo(() => {
    return new FormCore(
      model as string,
      [], // Initial empty schema, updated via useEffect
      [], // Initial empty users, updated via useEffect
      initialData as Record<string, unknown>,
      (state) => setFormState(state)
    )
    // We only recreate if model or id changes.
    // We include initialData in the dependencies if the record ID changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, id])

  // Update schema in core when it changes
  useEffect(() => {
    if (core) {
      core.updateSchema(schema)
    }
  }, [schema, core])

  // Update users in core when they change
  useEffect(() => {
    if (core) {
      core.updateUsers(users as AuthorUser[])
    }
  }, [users, core])

  // Debounced auto-save logic
  useEffect(() => {
    if (onAutoSave && formState.isDirty && !formState.isSubmitting) {
      const timer = setTimeout(() => {
        onAutoSave(formState.values as Partial<CMSModelMap[T]>)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [formState.values, formState.isDirty, formState.isSubmitting, onAutoSave])

  // Schema fetching logic (moved from RecordForm)
  useEffect(() => {
    let isMounted = true
    const fetchSchema = async () => {
      if (!isMounted) return
      setFetchingSchema(true)
      try {
        const headers: Record<string, string> = {}
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        const response = await fetch(
          `/api/models/schema/fields?table=${model}`,
          { headers }
        )
        if (!response.ok) throw new Error("Failed to fetch fields")
        const data = await response.json()

        if (data && data.length > 0) {
          if (!isMounted) return
          const filteredData = data.filter(
            (f: CMSField) =>
              !["_draft", "status", "created_by", "updated_by"].includes(f.slug)
          )
          setSchema(filteredData)

          const supabase = createClient()
          const { data: modelData } = await supabase
            .from("models")
            .select("id")
            .eq("table_name", model)
            .single()

          if (modelData) {
            const fsResponse = await fetch(
              `/api/models/schema/fieldsets?model_id=${modelData.id}`,
              { headers }
            )
            if (fsResponse.ok) {
              const fsData = await fsResponse.json()
              setFieldsets(fsData || [])
            }
          }
        } else {
          // Fallback to raw schema
          const response = await fetch(`/api/models/schema?table=${model}`, {
            headers,
          })
          if (!response.ok) throw new Error("Failed to fetch schema")
          const rawData = await response.json()

          const mappedFields = rawData
            .filter(
              (f: FieldSchema) =>
                ![
                  "id",
                  "created_at",
                  "updated_at",
                  "status",
                  "_draft",
                  "created_by",
                  "updated_by",
                ].includes(f.column_name)
            )
            .map((f: FieldSchema) => ({
              id: f.column_name,
              slug: f.column_name,
              field_label: f.column_name.replace(/_/g, " "),
              field_type:
                f.data_type === "boolean"
                  ? "boolean"
                  : f.data_type === "integer" || f.data_type === "numeric"
                    ? "number"
                    : "text_single",
              is_required: f.is_nullable === "NO",
              model_id: "",
              is_unique: false,
              is_system: false,
              is_computed: false,
              ui_order: 0,
            }))

          if (!isMounted) return
          setSchema(mappedFields as CMSField[])
        }
      } catch (err) {
        if (!isMounted) return
        console.error("Error fetching schema:", err)
      } finally {
        if (!isMounted) return
        setFetchingSchema(false)
      }
    }
    fetchSchema()
    return () => {
      isMounted = false
    }
  }, [model, accessToken])

  return {
    formState,
    schema,
    fieldsets,
    fetchingSchema,
    actions: core,
  }
}
