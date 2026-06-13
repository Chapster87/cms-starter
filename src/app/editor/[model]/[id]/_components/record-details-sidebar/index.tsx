"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { RecordBase } from "@/client/data-service"
import SvgIcon from "@/components/svg-icon"
import { RecordStatus } from "@/app/editor/[model]/_components/status-badge"
import s from "./style.module.css"

interface RecordDetailsSidebarProps {
  record: RecordBase | null
  status: RecordStatus
}

/**
 * Sidebar displaying metadata and status for a specific record.
 */
export default function RecordDetailsSidebar({
  record,
  status,
}: RecordDetailsSidebarProps) {
  if (!record) return null

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
        defaultValue={["record-info", "published-version"]}
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
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>Publish Status</span>
                  <div className={s.statusWrapper}>
                    <div className={`${s.statusDot} ${s[status]}`} />
                    <span className={s.infoValue}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                </div>
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
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>

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
      </Accordion.Root>
    </aside>
  )
}
