"use client"

import { useCallback, useMemo } from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import Modal from "@/components/modal"
import { useModels, ModelRegistryEntry } from "@/hooks/use-models"
import ModalField from "./modal-field"
import ModalModel from "./modal-model"

/**
 * URL Schema for Schema Management Modals:
 * ---------------------------------------
 * Create Model:    ?action=new-model
 * Edit Model:      ?action=edit-model&modelSlug=[slug]
 * Duplicate Model: ?action=duplicate-model&modelSlug=[slug]
 *
 * Create Field:    ?action=new-field
 * Edit Field:      ?action=edit-field&fieldId=[id]
 * Duplicate Field: ?action=duplicate-field&fieldId=[id]
 */

/**
 * SchemaModal is a URL-driven wrapper that handles high-level schema definitions.
 * It dynamically switches between different modal forms based on the 'action' query parameter.
 */
export default function SchemaModal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()

  const action = searchParams.get("action")
  const modelSlug = searchParams.get("modelSlug")
  const fieldId = searchParams.get("fieldId")

  const { models } = useModels()

  // The model ID usually comes from the URL path [model]
  // but we can also fallback to searching by slug if needed.
  const modelIdFromPath = params?.model as string | undefined

  // Resolve the actual UUID from the slug if needed
  const resolvedModelId = useMemo(() => {
    if (modelIdFromPath?.includes("-")) return modelIdFromPath // Looks like a UUID
    const found = models.find(
      (m: ModelRegistryEntry) =>
        m.slug === modelIdFromPath || m.table_name === modelIdFromPath
    )
    return found?.id || modelIdFromPath
  }, [modelIdFromPath, models])

  const isOpen = !!action

  const handleClose = useCallback(
    (shouldRefresh = false) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.delete("action")
      nextParams.delete("modelSlug")
      nextParams.delete("fieldId")

      const queryString = nextParams.toString()
      const url = queryString ? `?${queryString}` : window.location.pathname
      router.push(url)

      if (shouldRefresh) {
        // Trigger a refresh event that FieldList can listen for
        window.dispatchEvent(new CustomEvent("schema-update"))
      }
    },
    [router, searchParams]
  )

  const modalConfig = useMemo(() => {
    if (!action) return null

    if (action.includes("model")) {
      const mode = action.replace("-model", "") as "new" | "edit" | "duplicate"
      const normalizedMode = mode === "new" ? "create" : mode

      return {
        title:
          mode === "edit"
            ? "Edit Model"
            : mode === "duplicate"
              ? "Duplicate Model"
              : "Create New Model",
        description:
          mode === "edit"
            ? "Update model metadata."
            : "Define a new content structure.",
        content: (
          <ModalModel
            mode={normalizedMode}
            modelSlug={modelSlug}
            onSuccess={() => handleClose(true)}
            onCancel={() => handleClose(false)}
          />
        ),
      }
    }

    if (action.includes("field")) {
      const mode = action.replace("-field", "") as "new" | "edit" | "duplicate"
      const normalizedMode = mode === "new" ? "create" : mode

      return {
        title:
          mode === "edit"
            ? "Edit Field"
            : mode === "duplicate"
              ? "Duplicate Field"
              : "Add New Field",
        description:
          mode === "edit"
            ? "Update field configuration."
            : "Define a new field for this model.",
        content: (
          <ModalField
            mode={normalizedMode}
            fieldId={fieldId}
            modelId={resolvedModelId || ""}
            onSuccess={() => handleClose(true)}
            onCancel={() => handleClose(false)}
          />
        ),
      }
    }

    return null
  }, [action, modelSlug, fieldId, modelIdFromPath, handleClose])

  if (!isOpen || !modalConfig) return null

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title={modalConfig.title}
      description={modalConfig.description}
    >
      {modalConfig.content}
    </Modal>
  )
}
