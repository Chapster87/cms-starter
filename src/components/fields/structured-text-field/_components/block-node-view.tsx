import React, { useState, useEffect } from "react"
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react"
import { Blocks, Edit, Trash2 } from "lucide-react"

import Button from "@/components/button"
import Modal from "@/components/modal"
import BlockForm from "../../modular-content-field/_components/block-form"
import { CMSBlock } from "@/types/fields"

import s from "./style.module.css"

/**
 * A React NodeView for rendering CMS blocks within the Tiptap editor.
 */
export default function BlockNodeView({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const { blockId, blockType, data } = node.attrs
  const [isEditing, setIsEditing] = useState(false)
  const [pendingData, setPendingData] = useState<Record<string, unknown>>(
    data || {}
  )
  const [blockDef, setBlockDef] = useState<CMSBlock | null>(null)

  useEffect(() => {
    async function fetchBlockDef() {
      if (!blockId) return
      try {
        const response = await fetch(`/api/blocks?id=${blockId}`)
        if (response.ok) {
          const blocks = await response.json()
          if (Array.isArray(blocks) && blocks.length > 0) {
            setBlockDef(blocks[0])
          }
        }
      } catch (error) {
        console.error("Error fetching block definition:", error)
      }
    }
    fetchBlockDef()
  }, [blockId])

  const displayLabel = blockDef
    ? `${blockDef.emoji || "📦"} ${blockDef.label}`.trim()
    : blockType || "Unknown Block"

  return (
    <NodeViewWrapper className={s.wrapper}>
      <div className={s.container}>
        <div className={s.icon}>
          <Blocks size={16} />
        </div>
        <div className={s.content}>
          <span className={s.label}>{displayLabel}</span>
          <span className={s.type}>Type: {blockType}</span>
        </div>
        <div className={s.actions}>
          <Button
            variant="secondary"
            unstyled
            onClick={() => {
              setPendingData(data || {})
              setIsEditing(true)
            }}
            title="Edit Block"
            className={s.actionBtn}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="secondary"
            unstyled
            onClick={deleteNode}
            title="Remove Block"
            className={s.actionBtn}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        title={`Edit Block: ${displayLabel}`}
      >
        <div className={s.modalContent}>
          <BlockForm
            blockId={blockId}
            data={pendingData}
            onChange={(newData) =>
              setPendingData((prev) => ({ ...prev, ...newData }))
            }
          />
          <div className={s.modalActions}>
            <Button
              onClick={() => {
                updateAttributes({ data: pendingData })
                setIsEditing(false)
              }}
            >
              Update Block
            </Button>
          </div>
        </div>
      </Modal>
    </NodeViewWrapper>
  )
}
