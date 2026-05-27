"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { dataService, RecordBase } from "@/client/data-service"
import { useAuth } from "@/hooks/use-auth"
import RecordForm from "@/app/editor/[model]/_components/record-form"
import s from "./style.module.css"

interface EditRecordPageProps {
  params: Promise<{
    model: string | undefined
    id: string | undefined
  }>
}

/**
 * Renders the page for editing an existing record.
 */
export default function EditRecordPage({ params }: EditRecordPageProps) {
  const router = useRouter()
  const { model, id } = use(params)
  const { accessToken, loading: authLoading } = useAuth()

  const [record, setRecord] = useState<RecordBase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadRecord = useCallback(async () => {
    if (!model || !id) return

    setLoading(true)
    setError(null)
    try {
      const data = await dataService.getRecordById(model, id)
      if (!data) {
        setError("Record not found.")
      } else {
        setRecord(data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading record")
    } finally {
      setLoading(false)
    }
  }, [model, id])

  useEffect(() => {
    if (!authLoading) {
      // Small timeout to move state updates out of the synchronous render/effect cycle
      const timer = setTimeout(() => {
        loadRecord()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [loadRecord, authLoading])

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (!model || !id) return

    setLoading(true)
    setError(null)
    try {
      await dataService.updateRecord(model, id, formData)
      setSuccess("Record updated successfully!")
      setTimeout(() => router.push(`/editor/${model}`), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update record")
    } finally {
      setLoading(false)
    }
  }

  if (loading || authLoading) return <p>Loading record...</p>
  if (!model || !id) return <p>Invalid parameters.</p>

  return (
    <div className={s.container}>
      <header className={s.header}>
        <h1>Edit {model} Record</h1>
        <Link href={`/editor/${model}`}>
          <button className={s.backButton}>Back to List</button>
        </Link>
      </header>

      {error && <p className={s.error}>{error}</p>}
      {success && <p className={s.success}>{success}</p>}

      {record && (
        <RecordForm
          model={model}
          initialData={record}
          onSubmit={handleSubmit}
          isLoading={loading}
        />
      )}
    </div>
  )
}
