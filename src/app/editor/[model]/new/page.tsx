"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { dataService } from "@/client/data-service"
import Button from "@/components/button"
import { useModels } from "@/hooks/use-models"
import { CMSModelName } from "@/types/cms-generated"
import RecordForm from "@/app/editor/[model]/_components/record-form"
import s from "./style.module.css"

interface NewRecordPageProps {
  params: Promise<{
    model: string | undefined
  }>
}

/**
 * Renders the page for creating a new record.
 */
export default function NewRecordPage({ params }: NewRecordPageProps) {
  const router = useRouter()
  const { model } = use(params)
  const { models } = useModels()

  const modelData = models.find((m) => m.slug === model)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (!model) return

    setLoading(true)
    setError(null)
    try {
      const newRecord = await dataService.createRecord(model, formData)
      setSuccess("Record created successfully!")

      const nextId = newRecord?.slug || newRecord?.id
      if (nextId) {
        setTimeout(() => router.push(`/editor/${model}/${nextId}`), 1500)
      } else {
        setTimeout(() => router.push(`/editor/${model}`), 1500)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create record")
    } finally {
      setLoading(false)
    }
  }

  if (!model) return <p>Invalid model specified.</p>
  const modelName = model as CMSModelName

  return (
    <div className={s.container}>
      <header className={s.header}>
        <h1>Create New {model}</h1>
        <Link href={`/editor/${model}`}>
          <Button variant="secondary">Back to List</Button>
        </Link>
      </header>

      {error && <p className={s.error}>{error}</p>}
      {success && <p className={s.success}>{success}</p>}

      <RecordForm
        model={modelName}
        onSubmit={handleSubmit}
        isLoading={loading}
        hasDraftMode={modelData?.has_draft_mode}
      />
    </div>
  )
}
