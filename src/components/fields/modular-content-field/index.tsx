"use client"

import React, { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, Blocks } from "lucide-react"

import Button from "@/components/button"
import CollapsibleDndWrapper from "@/components/collapsible-dnd-wrapper"
import FieldWrapper from "../field-wrapper"
import BlockForm from "./_components/block-form"
import BlockSelectorModal from "./_components/block-selector-modal"
import { CMSBlock } from "@/types/fields"

import s from "./style.module.css"

interface BlockInstance {
  _id: string // Local unique ID for DND
  _type: string // Block API ID
  [key: string]: unknown
}

interface ModularContentFieldProps {
  label: string
  value: BlockInstance[] | string
  onChange: (value: BlockInstance[]) => void
  allowedBlocks?: string[]
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
}

/**
 * A dynamic field type that allows composing a list of reusable blocks.
 * Blocks can be reordered, collapsed, and edited independently.
 */
export default function ModularContentField({
  label,
  value,
  onChange,
  allowedBlocks,
  description,
  fieldNote,
  required,
  disabled,
}: ModularContentFieldProps) {
  const id = React.useId()
  const [availableBlocks, setAvailableBlocks] = useState<CMSBlock[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Ensure value is an array
  const blocks = React.useMemo(() => {
    if (Array.isArray(value)) return value

    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed || trimmed === "null") return []

      // Check if it's already a stringified JSON object/array
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          // Attempt to clean trailing commas before parsing
          const cleaned = trimmed.replace(/,\s*([\]}])/g, "$1")
          const parsed = JSON.parse(cleaned)
          return Array.isArray(parsed) ? parsed : []
        } catch (e) {
          console.error("Failed to parse modular content JSON string:", e, {
            value: trimmed,
          })
        }
      }
    }

    return []
  }, [value])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const response = await fetch("/api/blocks")
        if (!response.ok) throw new Error("Failed to fetch blocks")
        const allBlocks = (await response.json()) as CMSBlock[]

        // Filter based on allowedBlocks setting.
        // We default to NO blocks if none are explicitly allowed.
        if (allowedBlocks && allowedBlocks.length > 0) {
          setAvailableBlocks(
            allBlocks.filter((b) => allowedBlocks.includes(b.id))
          )
        } else {
          setAvailableBlocks([])
        }
      } catch (error) {
        console.error("Error fetching blocks:", error)
      }
    }

    fetchBlocks()
  }, [allowedBlocks])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b._id === active.id)
      const newIndex = blocks.findIndex((b) => b._id === over.id)
      onChange(arrayMove(blocks, oldIndex, newIndex))
    }
  }

  function addBlock(block: CMSBlock) {
    const newBlock: BlockInstance = {
      _id: crypto.randomUUID(),
      _type: block.api_id,
      _block_id: block.id, // Keep the UUID for field fetching
    }
    onChange([...blocks, newBlock])
    setIsModalOpen(false)
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b._id !== id))
  }

  function updateBlockData(id: string, data: Record<string, unknown>) {
    onChange(
      blocks.map((b) => {
        if (b._id === id) {
          return { ...b, ...data }
        }
        return b
      })
    )
  }

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <div className={s.container}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={s.blockList}>
              {blocks.map((block) => {
                const blockDef = availableBlocks.find(
                  (b) => b.api_id === block._type || b.id === block._block_id
                )
                const displayLabel = blockDef
                  ? `${blockDef.emoji || ""} ${blockDef.label}`.trim()
                  : block._type

                return (
                  <CollapsibleDndWrapper
                    key={block._id}
                    id={block._id}
                    label={displayLabel}
                    icon={<Blocks size={14} />}
                    onDelete={() => removeBlock(block._id)}
                    className={s.blockWrapper}
                  >
                    <BlockForm
                      blockId={(block._block_id as string) || ""}
                      data={block}
                      onChange={(data) => updateBlockData(block._id, data)}
                      disabled={disabled}
                    />
                  </CollapsibleDndWrapper>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>

        <div className={s.actions}>
          <Button
            type="button"
            variant="secondary"
            beforeText={<Plus size={16} />}
            disabled={disabled}
            onClick={() => setIsModalOpen(true)}
          >
            Add Block
          </Button>

          <BlockSelectorModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            blocks={availableBlocks}
            onSelect={addBlock}
          />
        </div>
      </div>
    </FieldWrapper>
  )
}
