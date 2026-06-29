"use client"

import { use } from "react"
import Link from "next/link"
import Button from "@/components/button"
import { useBlocks } from "@/hooks/use-blocks"
import FieldList from "../../_components/field-list"
import s from "./style.module.css"

interface BlockPageProps {
  params: Promise<{
    blockId: string | undefined
  }>
}

/**
 * Renders the schema management page for a specific block.
 */
export default function BlockSchemaPage({ params }: BlockPageProps) {
  const { blockId } = use(params)
  const { blocks, loading, error } = useBlocks()

  const blockData = blocks.find((b) => b.id === blockId)

  if (loading) return <p>Loading block schema...</p>
  if (error) return <p>Error: {error}</p>
  if (!blockData) return <p>Block not found: {blockId}</p>

  return (
    <div className={s.modelMain}>
      <div className={s.header}>
        <div className={s.titleGroup}>
          <h1>
            <span className={s.emojiPrefix}>{blockData.emoji || "📦"}</span>
            {blockData.label}{" "}
            <span className={s.tableName}>{blockData.api_id}</span>
          </h1>
        </div>
        <Link href={`?action=edit-block&blockId=${blockId}`}>
          <Button variant="secondary">Block Settings</Button>
        </Link>
      </div>

      <FieldList blockId={blockId} />
    </div>
  )
}
