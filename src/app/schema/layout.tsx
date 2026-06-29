"use client"

import React, { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import BlockList from "./_components/block-list"
import ModelList from "./_components/model-list"
import SchemaModal from "./_components/schema-modal"
import Tabs from "@/components/tabs"

import { useBlocks } from "@/hooks/use-blocks"
import { useModels } from "@/hooks/use-models"

import s from "./style.module.css"

/**
 * Layout for the schema management section.
 * Provides the model list navigation and fetches data once for all sub-pages.
 */
export default function SchemaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    models,
    groups: modelGroups,
    loading: modelsLoading,
    error: modelsError,
  } = useModels()
  const {
    blocks,
    groups: blockGroups,
    loading: blocksLoading,
    error: blocksError,
  } = useBlocks()
  const pathname = usePathname()

  const activeTab = pathname.startsWith("/schema/block") ? "blocks" : "models"

  if (modelsLoading || blocksLoading)
    return (
      <div className={s.schemaContent}>
        <p>Loading schema...</p>
      </div>
    )
  if (modelsError || blocksError)
    return (
      <div className={s.schemaContent}>
        <p style={{ color: "red" }}>Error: {modelsError || blocksError}</p>
      </div>
    )

  return (
    <div className={s.schemaContent}>
      <div className={s.sidebar}>
        <Tabs value={activeTab} className={s.schemaTabs}>
          <Tabs.List>
            <Link href="/schema/model" className={s.tabLink}>
              <Tabs.Trigger value="models">Models</Tabs.Trigger>
            </Link>
            <Link href="/schema/block" className={s.tabLink}>
              <Tabs.Trigger value="blocks">Blocks</Tabs.Trigger>
            </Link>
          </Tabs.List>

          <Tabs.Content value="models" className={s.schemaTabsContent}>
            <ModelList models={models} groups={modelGroups} />
          </Tabs.Content>

          <Tabs.Content value="blocks" className={s.schemaTabsContent}>
            <BlockList blocks={blocks} groups={blockGroups} />
          </Tabs.Content>
        </Tabs>
      </div>

      <div className={s.mainContent}>{children}</div>
      <Suspense fallback={null}>
        <SchemaModal />
      </Suspense>
    </div>
  )
}
