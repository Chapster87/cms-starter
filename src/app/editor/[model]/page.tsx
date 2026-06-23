"use client"

import { useState, useEffect, useCallback, use, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { dataService, RecordBase } from "@/client/data-service"
import Button from "@/components/button"
import { useAuth } from "@/hooks/use-auth"
import { useModels } from "@/hooks/use-models"
import { getRecordDisplayName } from "@/helpers/record-helpers"
import ContextMenu from "@/components/context-menu"
import { useUsers } from "@/hooks/use-users"
import {
  Edit2,
  Trash2,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
} from "lucide-react"
import ColumnSettings from "./_components/column-settings"
import SortSettings from "./_components/sort-settings"
import { CMSField } from "@/types/fields"
import { MediaAsset } from "@/types/media"
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
  const router = useRouter()
  const { accessToken, loading: authLoading } = useAuth()
  const { models, refresh: refreshModels } = useModels()
  const { users } = useUsers()
  const [records, setRecords] = useState<RecordBase[]>([])
  const [fields, setFields] = useState<CMSField[]>([])
  const [resolvedReferences, setResolvedReferences] = useState<
    Record<string, string>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const modelData = models.find((m) => m.slug === modelSlug) || null

  const [sortColumn, setSortColumn] = useState<string>(
    modelData?.default_sort_column || "created_at"
  )
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    (modelData?.default_sort_direction as "asc" | "desc") || "desc"
  )

  const loadRecords = useCallback(async () => {
    if (!modelSlug || !accessToken) return

    setLoading(true)
    setError(null)
    try {
      const [fetchedRecords, fieldsRes] = await Promise.all([
        dataService.getRecords(modelSlug, sortColumn, sortDirection),
        fetch(`/api/models/schema/fields?table=${modelSlug}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])

      setRecords(fetchedRecords)

      if (fieldsRes.ok) {
        const fieldsData: CMSField[] = await fieldsRes.json()
        setFields(fieldsData)

        // Bulk resolve references
        const referenceFields = fieldsData.filter(
          (f) => f.field_type === "reference"
        )
        if (referenceFields.length > 0) {
          const refsToFetch: Record<string, string[]> = {}

          fetchedRecords.forEach((rec) => {
            referenceFields.forEach((f) => {
              const val = rec[f.field_name]
              if (val) {
                // If it's a string, use it directly as the ID
                // If it's an object with id (rare for this CMS but good for safety), use .id
                const ids = Array.isArray(val)
                  ? (val as string[])
                  : [val as string]

                // Use the configured allowed_models from field settings
                const allowedModels = f.settings.allowed_models || []
                allowedModels.forEach((targetModel) => {
                  if (!refsToFetch[targetModel]) refsToFetch[targetModel] = []
                  ids.forEach((id) => {
                    if (
                      typeof id === "string" &&
                      !refsToFetch[targetModel].includes(id)
                    ) {
                      refsToFetch[targetModel].push(id)
                    }
                  })
                })
              }
            })
          })

          const allRefPromises = Object.entries(refsToFetch).map(
            async ([mSlug, ids]) => {
              const res = await fetch(`/api/records/list`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ models: [mSlug], filters: { id: ids } }),
              })
              if (res.ok) {
                const data: Array<{ id: string; display_name: string }> =
                  await res.json()
                return data
              }
              return []
            }
          )

          const resolvedResults = await Promise.all(allRefPromises)
          const newResolved: Record<string, string> = {}
          resolvedResults.flat().forEach((item) => {
            newResolved[item.id] = item.display_name
          })
          setResolvedReferences((prev) => ({ ...prev, ...newResolved }))
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading records"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [modelSlug, accessToken, sortColumn, sortDirection])

  useEffect(() => {
    if (!authLoading && accessToken) {
      const timer = setTimeout(() => {
        void loadRecords()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [loadRecords, authLoading, accessToken, sortColumn, sortDirection])

  // Redirect singletons if a record already exists
  useEffect(() => {
    if (modelData?.is_singleton && records.length === 1 && !loading) {
      const record = records[0]
      router.replace(`/editor/${modelSlug}/${record.slug || record.id}`)
    }
  }, [modelData, records, loading, modelSlug, router])

  /**
   * Deletes a record after user confirmation.
   * @param id The UUID of the record to delete.
   */
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
    return getRecordDisplayName(
      record,
      modelData?.friendly_name,
      modelData?.is_singleton,
      modelData?.list_columns
    )
  }

  const handleUpdateColumns = async (newColumns: string[]) => {
    if (!modelData || !accessToken) return

    try {
      const res = await fetch("/api/models", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          table_name: modelData.table_name,
          list_columns: newColumns,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update columns")
      }

      await refreshModels()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update columns")
    }
  }

  // Determine which columns to show
  const activeColumns = useMemo(() => {
    const listColumns = modelData?.list_columns
    if (listColumns && listColumns.length > 0) {
      return listColumns.map((colName) => {
        const field = fields.find((f) => f.field_name === colName)
        return {
          name: colName,
          label: field?.field_label || colName,
          isReference: field?.field_type === "reference",
          isSortable: field?.field_type !== "media",
        }
      })
    }

    // Default columns
    const firstField = fields.find((f) => !f.is_system)
    const cols = []
    if (firstField) {
      cols.push({
        name: firstField.field_name,
        label: firstField.field_label,
        isReference: firstField.field_type === "reference",
        isSortable: firstField.field_type !== "media",
      })
    }
    return cols
  }, [modelData, fields])

  const handleSort = async (columnName: string) => {
    let newDir: "asc" | "desc" = "asc"
    let newCol = columnName

    if (sortColumn === columnName) {
      newDir = sortDirection === "asc" ? "desc" : "asc"
    } else {
      newCol = columnName
      newDir = "asc"
    }

    setSortColumn(newCol)
    setSortDirection(newDir)

    // Persist to database
    if (modelData && accessToken) {
      try {
        await fetch("/api/models", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            table_name: modelData.table_name,
            default_sort_column: newCol,
            default_sort_direction: newDir,
          }),
        })
        // No need to refreshModels() here as it might trigger a flash,
        // the local state is already updated.
      } catch (err) {
        console.error("Failed to persist sort order:", err)
      }
    }
  }

  const renderSortIcon = (columnName: string) => {
    if (sortColumn !== columnName) {
      return <ArrowUpDown size={12} className={s.sortIconPlaceholder} />
    }
    return sortDirection === "asc" ? (
      <ArrowUpAZ size={12} className={s.sortIconActive} />
    ) : (
      <ArrowDownAZ size={12} className={s.sortIconActive} />
    )
  }

  if (loading || authLoading) {
    return (
      <div className={s.container}>
        <p>Loading records...</p>
      </div>
    )
  }

  if (!modelSlug) {
    return (
      <div className={s.container}>
        <p>Invalid model specified.</p>
      </div>
    )
  }

  // Avoid flash of table for singletons that are about to redirect
  if (modelData?.is_singleton && records.length === 1 && !loading) {
    return (
      <div className={s.container}>
        <p>Redirecting to editor...</p>
      </div>
    )
  }

  if (modelData?.is_singleton && records.length === 0 && !loading) {
    return (
      <div className={s.singletonEmpty}>
        <div className={s.emptyCard}>
          <div className={s.emptyIcon}>
            {modelData?.emoji || (
              <svg
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </div>
          <h2>{modelData?.friendly_name || modelSlug}</h2>
          <p>
            This is a singleton model, which means it only ever has one record.
            Initialize it to start managing your content.
          </p>
          <Link href={`?action=new-record`}>
            <Button size="large">Initialize {modelData?.friendly_name}</Button>
          </Link>
        </div>
      </div>
    )
  }

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
          {modelData && (
            <>
              <SortSettings
                fields={fields}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSortChange={async (col, dir) => {
                  setSortColumn(col)
                  setSortDirection(dir)

                  // Persist to database
                  if (modelData && accessToken) {
                    try {
                      await fetch("/api/models", {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                          table_name: modelData.table_name,
                          default_sort_column: col,
                          default_sort_direction: dir,
                        }),
                      })
                    } catch (err) {
                      console.error("Failed to persist sort order:", err)
                    }
                  }
                }}
              />
              <ColumnSettings
                model={modelData}
                fields={fields}
                onUpdate={handleUpdateColumns}
              />
            </>
          )}

          {(!modelData?.is_singleton || records.length === 0) && (
            <Link
              href={
                modelData?.is_singleton
                  ? `?action=new-record`
                  : `/editor/${modelSlug}/new`
              }
            >
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
          )}
        </div>
      </header>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead>
            <tr>
              {activeColumns.map((col) => (
                <th
                  key={col.name}
                  onClick={() => col.isSortable && handleSort(col.name)}
                  className={col.isSortable ? s.sortableHeader : ""}
                >
                  <div className={s.headerContent}>
                    {col.label}
                    {col.isSortable && renderSortIcon(col.name)}
                  </div>
                </th>
              ))}
              {modelData && modelData.has_draft_mode && (
                <th style={{ width: "100px" }}>Status</th>
              )}
              <th
                onClick={() => handleSort("updated_at")}
                className={s.sortableHeader}
              >
                <div className={s.headerContent}>
                  Updated At
                  {renderSortIcon("updated_at")}
                </div>
              </th>
              <th>Created By</th>
              <th className={s.actionsCell}></th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const isPublished = record.status === "published"
              const hasDraft = !!record._draft
              const isChanged = isPublished && hasDraft

              return (
                <tr key={record.id}>
                  {activeColumns.map((col, idx: number) => {
                    const val = record[col.name]
                    const field = fields.find((f) => f.field_name === col.name)
                    const isMedia = field?.field_type === "media"

                    const cellContent = (
                      <>
                        {val === null || val === undefined ? (
                          "-"
                        ) : col.isReference ? (
                          Array.isArray(val) ? (
                            (val as string[])
                              .map((id) => resolvedReferences[id] || id)
                              .join(", ")
                          ) : (
                            resolvedReferences[val as string] || (val as string)
                          )
                        ) : isMedia ? (
                          <div style={{ display: "flex", gap: "4px" }}>
                            {(Array.isArray(val)
                              ? (val as MediaAsset[])
                              : [val as MediaAsset]
                            ).map((asset, i) => (
                              <div key={i} className={s.mediaAssetThumb}>
                                <Image
                                  src={
                                    (
                                      asset as unknown as {
                                        secure_url?: string
                                      }
                                    ).secure_url || asset.url
                                  }
                                  alt=""
                                  fill
                                  sizes="32px"
                                  className={s.mediaAssetImage}
                                  unoptimized // External CMS assets often need this unless loader configured
                                />
                              </div>
                            ))}
                          </div>
                        ) : typeof val === "object" ? (
                          JSON.stringify(val)
                        ) : (
                          String(val)
                        )}
                      </>
                    )

                    if (idx === 0) {
                      return (
                        <td key={col.name}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {modelData && modelData.has_draft_mode && (
                              <div className={s.statusDots}>
                                {isPublished ? (
                                  <span
                                    className={`${s.statusDot} ${s.published}`}
                                    title="Published"
                                  />
                                ) : (
                                  <span
                                    className={`${s.statusDot} ${s.draft}`}
                                    title="Draft"
                                  />
                                )}
                                {isChanged && (
                                  <span
                                    className={`${s.statusDot} ${s.changed}`}
                                    title="Unpublished Changes"
                                  />
                                )}
                              </div>
                            )}
                            <Link
                              href={`/editor/${modelSlug}/${record.slug || record.id}`}
                              className={s.recordName}
                            >
                              {cellContent}
                            </Link>
                          </div>
                        </td>
                      )
                    }

                    return (
                      <td key={col.name} className={s.dateCell}>
                        {cellContent}
                      </td>
                    )
                  })}
                  {modelData && modelData.has_draft_mode && (
                    <td className={s.dateCell}>
                      <span
                        className={
                          isChanged
                            ? s.statusTextChanged
                            : isPublished
                              ? s.statusTextPublished
                              : s.statusTextDraft
                        }
                      >
                        {isChanged
                          ? "Changed"
                          : typeof record.status === "string"
                            ? record.status
                            : "draft"}
                      </span>
                    </td>
                  )}
                  <td className={s.dateCell}>
                    {record.updated_at
                      ? new Date(record.updated_at as string).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className={s.dateCell}>
                    {users.find(
                      (u) =>
                        u.id === (record as { created_by?: string }).created_by
                    )?.email || "System"}
                  </td>
                  <td className={s.actionsCell}>
                    <ContextMenu>
                      <ContextMenu.Trigger className={s.actionsButton} asChild>
                        <button
                          className={s.unstyledButton}
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
                        </button>
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
              )
            })}
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
