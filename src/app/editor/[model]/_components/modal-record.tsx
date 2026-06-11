"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/client/toast-store"
import { dataService } from "@/client/data-service"
import Modal from "@/components/modal"
import RecordForm from "./record-form"

interface ModalRecordProps {
  model: string
  isSingleton?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (id: string) => void
}

/**
 * Modal wrapper for creating a new record.
 */
export default function ModalRecord({
  model,
  isSingleton,
  isOpen,
  onOpenChange,
  onSuccess,
}: ModalRecordProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setIsSaving(true)
    setError(null)
    try {
      if (isSingleton) {
        const existing = await dataService.getRecords(model)
        if (existing && existing.length > 0) {
          throw new Error(
            "A record already exists for this singleton model. You cannot create another one."
          )
        }
      }

      const result = await dataService.createRecord(model, formData)
      if (!result) throw new Error("Failed to create record: No data returned")

      toast.success(
        "Record created",
        `New record in ${model} has been initialized.`
      )

      if (onSuccess) {
        onOpenChange(false)
        onSuccess(result.id)
      } else {
        // Navigate to the new record. This will naturally close the modal
        // because the new URL won't have the ?action=new-record param.
        router.push(`/editor/${model}/${result.slug || result.id}`)
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create record"
      setError(msg)
      toast.error("Error creating record", msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`Create New ${model}`}
      description={`Fill in the fields below to initialize this ${model} record.`}
    >
      <div style={{ padding: "20px" }}>
        {error && (
          <p style={{ color: "var(--color-danger)", marginBottom: "16px" }}>
            {error}
          </p>
        )}
        <RecordForm
          model={model}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        />
      </div>
    </Modal>
  )
}
