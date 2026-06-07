"use client"

import React, { Suspense } from "react"

import ModelList from "./_components/model-list"
import SchemaModal from "./_components/schema-modal"
import Tabs from "@/components/tabs"

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
  const { models, groups, loading, error } = useModels()

  if (loading)
    return (
      <div className={s.schemaContent}>
        <p>Loading models...</p>
      </div>
    )
  if (error)
    return (
      <div className={s.schemaContent}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    )

  return (
    <div className={s.schemaContent}>
      <div className={s.sidebar}>
        <Tabs defaultValue="models" className={s.schemaTabs}>
          <Tabs.List>
            <Tabs.Trigger value="models">Models</Tabs.Trigger>
            <Tabs.Trigger value="blocks">Blocks</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="models" className={s.schemaTabsContent}>
            <ModelList models={models} groups={groups} />
          </Tabs.Content>

          <Tabs.Content value="blocks" className={s.schemaTabsContent}>
            <div className={s.placeholder}>
              <p>Blocks content coming soon...</p>
            </div>
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
