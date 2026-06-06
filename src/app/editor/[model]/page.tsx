"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { dataService, RecordBase } from "@/client/data-service"
import Button from "@/components/button"
import { useAuth } from "@/hooks/use-auth"
import { useModels } from "@/hooks/use-models"
import ContextMenu from "@/components/context-menu"
import { Edit2, Trash2 } from "lucide-react"
import s from "./style.module.css"

interface RecordListPageProps {
  params: Promise<{
    model: string | undefined
  }>
}

/**
 * Renders a list of records for a specific model in a branded table.
 */
export default function RecordListPage({ params }: RecordListPageProps) {
  const { model: modelSlug } = use(params)
  const { accessToken, loading: authLoading } = useAuth()
  const { models } = useModels()
  const [records, setRecords] = useState<RecordBase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const modelData = models.find((m) => m.slug === modelSlug)

  const loadRecords = useCallback(async () => {
    if (!modelSlug) return

    setLoading(true)
    setError(null)
    try {
      const fetchedRecords = await dataService.getRecords(modelSlug)
      setRecords(fetchedRecords)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading records"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [modelSlug])

  useEffect(() => {
    if (!authLoading && accessToken) {
      const timer = setTimeout(() => {
        loadRecords()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [loadRecords, authLoading, accessToken])

  const handleDelete = async (id: string) => {
    if (!modelSlug) return
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      await dataService.deleteRecord(modelSlug, id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete record")
    }
  }

  const getDisplayName = (record: RecordBase) => {
    // Try to find a sensible display name from the record data
    const nameFields = ["name", "title", "label", "heading", "friendly_name"]
    for (const field of nameFields) {
      if (record[field] && typeof record[field] === "string") {
        return record[field] as string
      }
    }

    // Fallback: look for the first string field that isn't a system field
    const systemFields = ["id", "created_at", "updated_at", "slug"]
    for (const key in record) {
      if (!systemFields.includes(key) && typeof record[key] === "string") {
        return record[key] as string
      }
    }

    return record.slug
      ? (record.slug as string)
      : `Record ${record.id.substring(0, 8)}...`
  }

  if (loading || authLoading)
    return (
      <div className={s.container}>
        <p>Loading records...</p>
      </div>
    )

  if (!modelSlug)
    return (
      <div className={s.container}>
        <p>Invalid model specified.</p>
      </div>
    )

  return (
    <div className={s.container}>
      <header className={s.header}>
        <div className={s.titleGroup}>
          <h1>
            <span className={s.emojiPrefix}>
              {modelData?.emoji || (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
            </span>
            {modelData?.friendly_name || modelSlug} Records
          </h1>
        </div>
        <div className={s.actions}>
          <Link href={`/editor/${modelSlug}/new`}>
            <Button
              beforeText={
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            >
              Add New
            </Button>
          </Link>
        </div>
      </header>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Updated At</th>
              <th>Created At</th>
              <th className={s.actionsCell}></th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <Link
                    href={`/editor/${modelSlug}/${record.slug || record.id}`}
                    className={s.recordName}
                  >
                    {getDisplayName(record)}
                  </Link>
                </td>
                <td className={s.dateCell}>
                  {record.updated_at
                    ? new Date(record.updated_at as string).toLocaleString()
                    : "N/A"}
                </td>
                <td className={s.dateCell}>
                  {record.created_at
                    ? new Date(record.created_at as string).toLocaleString()
                    : "N/A"}
                </td>
                <td className={s.actionsCell}>
                  <ContextMenu>
                    <ContextMenu.Trigger className={s.actionsButton}>
                      <Button
                        variant="secondary"
                        unstyled
                        type="button"
                        aria-label="More options"
                      >
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </Button>
                    </ContextMenu.Trigger>
                    <ContextMenu.Content>
                      <ContextMenu.Link
                        href={`/editor/${modelSlug}/${record.slug || record.id}`}
                        icon={<Edit2 size={14} />}
                      >
                        Edit
                      </ContextMenu.Link>
                      <ContextMenu.Item
                        onSelect={() => handleDelete(record.id)}
                        variant="danger"
                        icon={<Trash2 size={14} />}
                      >
                        Delete
                      </ContextMenu.Item>
                    </ContextMenu.Content>
                  </ContextMenu>
                </td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className={s.empty}>
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
