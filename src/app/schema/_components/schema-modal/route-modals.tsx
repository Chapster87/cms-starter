"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import Modal from "@/components/modal"
import { useModels, ModelRegistryEntry } from "@/hooks/use-models"
import ModalBlockGroup from "../modal-block-group"
import FieldTypeGrid from "./field-type-grid"
import ModalBlock from "./modal-block"
import ModalField from "./modal-field"
import ModalModel from "./modal-model"
import ModalModelGroup from "./modal-model-group"
import { useSchemaModalNavigation } from "./use-schema-modal-navigation"

/**
 * Handles Modal creation, editing, and duplication.
 */
export function ModelRouteModal() {
  const { searchParams, handleClose } = useSchemaModalNavigation()
  const action = searchParams.get("action")
  const modelSlug = searchParams.get("modelSlug")

  if (!action || !action.includes("model")) return null

  const mode = action.replace("-model", "") as "new" | "edit" | "duplicate"
  const normalizedMode = mode === "new" ? "create" : mode

  const title =
    mode === "edit"
      ? "Edit Model"
      : mode === "duplicate"
        ? "Duplicate Model"
        : "Create New Model"

  const description =
    mode === "edit"
      ? "Update model metadata."
      : "Define a new content structure."

  return (
    <Modal
      isOpen={true}
      onOpenChange={(open) => !open && handleClose()}
      title={title}
      description={description}
    >
      <ModalModel
        mode={normalizedMode}
        modelSlug={modelSlug}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </Modal>
  )
}

/**
 * Handles Field type selection and field configuration.
 */
export function FieldRouteModal() {
  const { searchParams, router, handleClose } = useSchemaModalNavigation()
  const params = useParams()
  const { models } = useModels()

  const action = searchParams.get("action")
  const fieldId = searchParams.get("fieldId")
  const fieldType = searchParams.get("fieldType")
  const blockId = searchParams.get("blockId")

  // The model ID usually comes from the URL path [model]
  const modelIdFromPath = params?.model as string | undefined

  // Resolve the actual UUID from the slug if needed
  const resolvedModelId = useMemo(() => {
    if (!modelIdFromPath) return ""
    if (modelIdFromPath.includes("-")) return modelIdFromPath // Looks like a UUID
    const found = models.find(
      (m: ModelRegistryEntry) =>
        m.slug === modelIdFromPath || m.table_name === modelIdFromPath
    )
    return found?.id || modelIdFromPath
  }, [modelIdFromPath, models])

  if (!action || !action.includes("field")) return null

  const mode = action.replace("-field", "") as "new" | "edit" | "duplicate"
  const normalizedMode = mode === "new" ? "create" : mode

  if (mode === "new" && !fieldType) {
    return (
      <Modal
        isOpen={true}
        onOpenChange={(open) => !open && handleClose()}
        title="Select Field Type"
        description="Choose the type of data this field will store."
      >
        <FieldTypeGrid
          onSelect={(type) => {
            const nextParams = new URLSearchParams(searchParams.toString())
            nextParams.set("fieldType", type)
            router.push(`?${nextParams.toString()}`)
          }}
        />
      </Modal>
    )
  }

  const title =
    mode === "edit"
      ? "Edit Field"
      : mode === "duplicate"
        ? "Duplicate Field"
        : "Configure New Field"

  const description =
    mode === "edit"
      ? "Update field configuration."
      : "Define the settings for your new field."

  return (
    <Modal
      isOpen={true}
      onOpenChange={(open) => !open && handleClose()}
      title={title}
      description={description}
    >
      <ModalField
        mode={normalizedMode}
        fieldId={fieldId}
        modelId={resolvedModelId}
        blockId={blockId}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </Modal>
  )
}

/**
 * Handles Model Group (folder) management.
 */
export function GroupRouteModal() {
  const { searchParams, handleClose } = useSchemaModalNavigation()
  const action = searchParams.get("action")
  const groupId = searchParams.get("groupId")

  if (!action || !action.includes("group") || action.includes("block"))
    return null

  const mode = action.replace("-group", "") as "new" | "edit"
  const normalizedMode = mode === "new" ? "create" : mode

  const title = mode === "edit" ? "Edit Group" : "Create New Group"
  const description =
    mode === "edit"
      ? "Update folder metadata."
      : "Organize your models into a folder."

  return (
    <Modal
      isOpen={true}
      onOpenChange={(open) => !open && handleClose()}
      title={title}
      description={description}
    >
      <ModalModelGroup
        mode={normalizedMode}
        groupId={groupId}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </Modal>
  )
}

/**
 * Handles reusable Block management.
 */
export function BlockRouteModal() {
  const { searchParams, handleClose } = useSchemaModalNavigation()
  const action = searchParams.get("action")
  const blockId = searchParams.get("blockId")

  if (!action || action.includes("group") || !action.includes("block"))
    return null

  const mode = action === "edit-block" ? "edit" : "create"
  const title = mode === "edit" ? "Edit Block" : "Create New Block"

  return (
    <Modal
      isOpen={true}
      onOpenChange={(open) => !open && handleClose()}
      title={title}
      description="Manage reusable field groups."
    >
      <ModalBlock
        mode={mode}
        blockId={blockId}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </Modal>
  )
}

/**
 * Handles Block Group management.
 */
export function BlockGroupRouteModal() {
  const { searchParams, handleClose } = useSchemaModalNavigation()
  const action = searchParams.get("action")
  const groupId = searchParams.get("blockGroupId")

  if (!action || !action.includes("block-group")) return null

  const mode = action === "edit-block-group" ? "edit" : "create"
  const title = mode === "edit" ? "Edit Block Group" : "Create Block Group"

  return (
    <Modal
      isOpen={true}
      onOpenChange={(open) => !open && handleClose()}
      title={title}
      description="Organize your blocks into folders."
    >
      <ModalBlockGroup
        mode={mode}
        groupId={groupId}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </Modal>
  )
}
