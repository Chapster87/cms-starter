"use client"

import { useMemo, ReactNode } from "react"
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

interface RouteModalContainerProps {
  title: string
  description?: string
  children: ReactNode
}

/**
 * Common wrapper for schema-related route modals.
 */
function RouteModalContainer({
  title,
  description,
  children,
}: RouteModalContainerProps) {
  const { handleClose } = useSchemaModalNavigation()

  return (
    <Modal
      isOpen={true}
      onOpenChange={(open) => !open && handleClose()}
      title={title}
      description={description}
    >
      {children}
    </Modal>
  )
}

/**
 * Handles Modal creation, editing, and duplication.
 */
export function ModelRouteModal() {
  const { action, searchParams, handleClose } = useSchemaModalNavigation()
  const modelSlug = searchParams.get("modelSlug")

  if (action?.entityType !== "model") return null

  const title =
    action.mode === "edit"
      ? "Edit Model"
      : action.mode === "duplicate"
        ? "Duplicate Model"
        : "Create New Model"

  const description =
    action.mode === "edit"
      ? "Update model metadata."
      : "Define a new content structure."

  return (
    <RouteModalContainer title={title} description={description}>
      <ModalModel
        mode={action.mode}
        modelSlug={modelSlug}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </RouteModalContainer>
  )
}

/**
 * Handles Field type selection and field configuration.
 */
export function FieldRouteModal() {
  const { action, searchParams, router, handleClose } =
    useSchemaModalNavigation()
  const params = useParams()
  const { models } = useModels()

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

  if (action?.entityType !== "field") return null

  if (action.mode === "create" && !fieldType) {
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
    action.mode === "edit"
      ? "Edit Field"
      : action.mode === "duplicate"
        ? "Duplicate Field"
        : "Configure New Field"

  const description =
    action.mode === "edit"
      ? "Update field configuration."
      : "Define the settings for your new field."

  return (
    <RouteModalContainer title={title} description={description}>
      <ModalField
        mode={action.mode}
        fieldId={fieldId}
        modelId={resolvedModelId}
        blockId={blockId}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </RouteModalContainer>
  )
}

/**
 * Handles Model Group (folder) management.
 */
export function GroupRouteModal() {
  const { action, searchParams, handleClose } = useSchemaModalNavigation()
  const groupId = searchParams.get("groupId")

  if (action?.entityType !== "group") return null

  const title = action.mode === "edit" ? "Edit Group" : "Create New Group"
  const description =
    action.mode === "edit"
      ? "Update folder metadata."
      : "Organize your models into a folder."

  return (
    <RouteModalContainer title={title} description={description}>
      <ModalModelGroup
        mode={action.mode as "create" | "edit"}
        groupId={groupId}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </RouteModalContainer>
  )
}

/**
 * Handles reusable Block management.
 */
export function BlockRouteModal() {
  const { action, searchParams, handleClose } = useSchemaModalNavigation()
  const blockId = searchParams.get("blockId")

  if (action?.entityType !== "block") return null

  const title = action.mode === "edit" ? "Edit Block" : "Create New Block"

  return (
    <RouteModalContainer
      title={title}
      description="Manage reusable field groups."
    >
      <ModalBlock
        mode={action.mode as "create" | "edit"}
        blockId={blockId}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </RouteModalContainer>
  )
}

/**
 * Handles Block Group management.
 */
export function BlockGroupRouteModal() {
  const { action, searchParams, handleClose } = useSchemaModalNavigation()
  const groupId = searchParams.get("blockGroupId")

  if (action?.entityType !== "block-group") return null

  const title =
    action.mode === "edit" ? "Edit Block Group" : "Create Block Group"

  return (
    <RouteModalContainer
      title={title}
      description="Organize your blocks into folders."
    >
      <ModalBlockGroup
        mode={action.mode as "create" | "edit"}
        groupId={groupId}
        onSuccess={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </RouteModalContainer>
  )
}
