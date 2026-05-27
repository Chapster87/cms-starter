"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { dataService, RecordBase } from "@/client/data-service"
import { useAuth } from "@/hooks/use-auth"
import s from "./style.module.css"

interface RecordListPageProps {
  params: Promise<{
    model: string | undefined
  }>
}

/**
 * Renders a list of records for a specific model.
 * Allows viewing, editing, and deleting records.
 */
export default function RecordListPage({ params }: RecordListPageProps) {
  const { model } = use(params)
  const { accessToken, loading: authLoading } = useAuth()
  const [records, setRecords] = useState<RecordBase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecords = useCallback(async () => {
    if (!model) return

    setLoading(true)
    setError(null)
    try {
      const fetchedRecords = await dataService.getRecords(model)
      setRecords(fetchedRecords)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading records"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [model])

  useEffect(() => {
    if (!authLoading) {
      // Small timeout to move state updates out of the synchronous render/effect cycle
      const timer = setTimeout(() => {
        loadRecords()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [loadRecords, authLoading])

  const handleDelete = async (id: string) => {
    if (!model) return
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      await dataService.deleteRecord(model, id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete record")
    }
  }

  if (loading || authLoading) return <p>Loading records...</p>
  if (!model) return <p>Invalid model specified.</p>

  return (
    <div className={s.container}>
      <header className={s.header}>
        <h1>{model} Records</h1>
        <div className={s.actions}>
          <Link href={`/editor/${model}/new`}>
            <button className={s.createButton}>Add New {model}</button>
          </Link>
        </div>
      </header>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>
                  {record.created_at
                    ? new Date(record.created_at).toLocaleString()
                    : "N/A"}
                </td>
                <td className={s.rowActions}>
                  <Link href={`/editor/${model}/${record.id}`}>
                    <button className={s.editButton}>Edit</button>
                  </Link>
                  <button
                    className={s.deleteButton}
                    onClick={() => handleDelete(record.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className={s.empty}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
