"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { RecordBase, dataService } from "@/client/data-service"
import SvgIcon from "@/components/svg-icon"
import { RecordStatus } from "@/app/editor/[model]/_components/status-badge"
import { useAuthors } from "@/hooks/use-authors"
import { useUsers } from "@/hooks/use-users"
import { toast } from "@/client/toast-store"
import AuditLog from "../audit-log"
import s from "./style.module.css"

interface RecordDetailsSidebarProps {
  record: RecordBase | null
  status: RecordStatus
  hasDraftMode?: boolean
}

/**
 * Sidebar displaying metadata and status for a specific record.
 */
export default function RecordDetailsSidebar({
  record,
  status,
  hasDraftMode = true,
}: RecordDetailsSidebarProps) {
  const { authors } = useAuthors()
  const { users } = useUsers()

  if (!record) return null

  const handleUpdateAttribution = async (
    field: "created_by" | "updated_by" | "author_id",
    value: string
  ) => {
    try {
      // Note: we need the model slug to update the record.
      // For now, let's assume we can get it from the URL or passed props.
      // Since it's not currently in props, we'll try to infer it or skip for now if too complex.
      // Actually, let's just use the current record's info if available.

      // @TODO: Implement attribution update logic once model slug is available here
      toast.info("Attribution update coming soon")
    } catch (err) {
      toast.error("Failed to update attribution")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  return (
    <aside className={s.sidebar} style={{ display: "flex" }}>
      <header className={s.header}>
        <h2 className={s.sidebarTitle}>Record Details</h2>
      </header>

      <Accordion.Root
        type="multiple"
        className={s.accordionRoot}
        defaultValue={["record-info", "published-version", "history"]}
      >
        <Accordion.Item value="record-info" className={s.accordionItem}>
          <Accordion.Header>
            <Accordion.Trigger className={s.accordionTrigger}>
              Record info
              <span className={s.chevron}>
                <SvgIcon icon="chevron-down" size={16} />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={s.accordionContent}>
            <div className={s.contentInner}>
              <div className={s.infoList}>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>Record ID</span>
                  <span className={s.infoValue}>{record.id}</span>
                </div>
                {hasDraftMode && (
                  <div className={s.infoItem}>
                    <span className={s.infoLabel}>Publish Status</span>
                    <div className={s.statusWrapper}>
                      <div className={`${s.statusDot} ${s[status]}`} />
                      <span className={s.infoValue}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  </div>
                )}
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>Created at</span>
                  <span className={s.infoValue}>
                    {formatDate(record.created_at)}
                  </span>
                </div>
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>Last update</span>
                  <span className={s.infoValue}>
                    {formatDate(record.updated_at)}
                  </span>
                </div>

                <div className={s.infoItem}>
                  <span className={s.infoLabel}>Author</span>
                  <select
                    className={s.attributionSelect}
                    value={(record as { author_id?: string }).author_id || ""}
                    onChange={(e) =>
                      handleUpdateAttribution("author_id", e.target.value)
                    }
                  >
                    <option value="">No Author</option>
                    {authors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={s.infoItem}>
                  <span className={s.infoLabel}>Created by</span>
                  <span className={s.infoValue}>
                    {users.find(
                      (u) =>
                        u.id === (record as { created_by?: string }).created_by
                    )?.email || "System"}
                  </span>
                </div>
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        {hasDraftMode && (
          <Accordion.Item value="published-version" className={s.accordionItem}>
            <Accordion.Header>
              <Accordion.Trigger className={s.accordionTrigger}>
                Published version
                <span className={s.chevron}>
                  <SvgIcon icon="chevron-down" size={16} />
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className={s.accordionContent}>
              <div className={s.contentInner}>
                <div className={s.infoList}>
                  <div className={s.infoItem}>
                    <span className={s.infoLabel}>Published at</span>
                    <span className={s.infoValue}>
                      {formatDate(record.published_at as string | undefined)}
                    </span>
                  </div>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        )}

        <Accordion.Item value="blocks" className={s.accordionItem}>
          <Accordion.Header>
            <Accordion.Trigger className={s.accordionTrigger}>
              Currently used blocks
              <span className={s.chevron}>
                <SvgIcon icon="chevron-down" size={16} />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={s.accordionContent}>
            <div className={s.contentInner}>
              <span className={s.comingSoon}>Coming soon</span>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="links" className={s.accordionItem}>
          <Accordion.Header>
            <Accordion.Trigger className={s.accordionTrigger}>
              Links
              <span className={s.chevron}>
                <SvgIcon icon="chevron-down" size={16} />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={s.accordionContent}>
            <div className={s.contentInner}>
              <span className={s.comingSoon}>Coming soon</span>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="history" className={s.accordionItem}>
          <Accordion.Header>
            <Accordion.Trigger className={s.accordionTrigger}>
              History
              <span className={s.chevron}>
                <SvgIcon icon="chevron-down" size={16} />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={s.accordionContent}>
            <div className={s.contentInner}>
              <AuditLog recordId={record.id} />
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </aside>
  )
}
