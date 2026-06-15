import React, { useCallback, useEffect, useState } from "react"
import { useAtomValue } from "jotai"
import { editorVersionAtom } from "@/client/editor-store"
import { createClient } from "@/utils/supabase"
import { formatDistanceToNow } from "date-fns"
import { RefreshCw } from "lucide-react"
import Avatar from "@/components/avatar"
import s from "./style.module.css"

interface AuditLog {
  id: string
  action: string
  created_at: string
  user_id: string
  changes: Record<string, unknown> | null
  user?: {
    display_name: string
    avatar_url: string
  }
}

interface AuditLogProps {
  recordId: string
}

/**
 * Displays a historical list of changes for a record.
 */
export default function AuditLog({ recordId }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const version = useAtomValue(editorVersionAtom)

  const fetchLogs = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("audit_logs")
        .select(
          `
          *,
          user:user_id (
            display_name,
            avatar_url
          )
        `
        )
        .eq("record_id", recordId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("AuditLog: Error fetching logs", error)
      }

      if (!error && data) {
        setLogs(data as unknown as AuditLog[])
      }
      setLoading(false)
    },
    [recordId]
  )

  useEffect(() => {
    let isMounted = true
    if (recordId) {
      // Use a microtask to avoid the "cascading renders" lint error
      // while still fetching on mount or version change
      Promise.resolve().then(() => {
        if (isMounted) {
          fetchLogs()
        }
      })
    }
    return () => {
      isMounted = false
    }
  }, [recordId, fetchLogs, version])

  if (loading && logs.length === 0) {
    return <div className={s.empty}>Loading history...</div>
  }

  if (logs.length === 0) {
    return <div className={s.empty}>No history found for this record.</div>
  }

  return (
    <div className={s.container}>
      <div className={s.refreshHeader}>
        <button
          onClick={() => fetchLogs(true)}
          disabled={loading}
          className={s.refreshButton}
          title="Refresh history"
        >
          <RefreshCw size={12} className={loading ? s.spinning : ""} />
          Refresh
        </button>
      </div>
      {logs.map((log) => (
        <div key={log.id} className={s.logItem}>
          <div className={s.avatarWrapper}>
            <Avatar
              src={log.user?.avatar_url}
              alt={log.user?.display_name || "System"}
              size={24}
            />
          </div>
          <div className={s.content}>
            <div className={s.header}>{log.user?.display_name || "System"}</div>
            <div className={s.action}>
              {getActionText(log.action, log.changes)}
            </div>
            {(log.action === "update" ||
              log.action === "draft_update" ||
              log.action === "publish") &&
              log.changes &&
              Object.keys(log.changes).length > 0 && (
                <div className={s.deltaDetails}>
                  {Object.keys(log.changes).map((key) => (
                    <span key={key} className={s.deltaKey}>
                      {key}
                    </span>
                  ))}
                </div>
              )}
            <div className={s.time}>
              {formatDistanceToNow(new Date(log.created_at), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function getActionText(
  action: string,
  changes: Record<string, unknown> | null
) {
  switch (action) {
    case "create":
      return "created the record"
    case "update":
      const keys = changes ? Object.keys(changes) : []
      if (keys.length === 1) return `updated ${keys[0]}`
      if (keys.length > 1) return `updated ${keys.length} fields`
      return "updated the record"
    case "publish":
      return "published the record"
    case "unpublish":
      return "unpublished the record"
    case "draft_update":
      return "updated the draft"
    default:
      return action
  }
}
