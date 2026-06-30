"use client"

import React from "react"
import { Blocks, Search, X } from "lucide-react"
import Modal from "@/components/modal"
import { CMSBlock } from "@/types/fields"
import s from "./block-selector-modal.module.css"

interface BlockSelectorModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  blocks: CMSBlock[]
  onSelect: (block: CMSBlock) => void
}

/**
 * A user-friendly modal for selecting CMS blocks to add to a field.
 */
export default function BlockSelectorModal({
  isOpen,
  onOpenChange,
  blocks,
  onSelect,
}: BlockSelectorModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredBlocks = blocks.filter(
    (block) =>
      block.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Select a Block"
      description="Choose a block type to add to your content."
    >
      <div className={s.container}>
        <div className={s.searchWrapper}>
          <Search className={s.searchIcon} size={18} />
          <input
            type="text"
            className={s.searchInput}
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              className={s.clearSearch}
              onClick={() => setSearchTerm("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={s.blockGrid}>
          {filteredBlocks.map((block) => (
            <button
              key={block.id}
              type="button"
              className={s.blockCard}
              onClick={() => onSelect(block)}
            >
              <div className={s.blockIcon}>
                {block.emoji ? (
                  <span className={s.emoji}>{block.emoji}</span>
                ) : (
                  <Blocks size={24} className={s.defaultIcon} />
                )}
              </div>
              <div className={s.blockInfo}>
                <span className={s.blockLabel}>{block.label}</span>
                {block.description && (
                  <span className={s.blockDesc}>{block.description}</span>
                )}
              </div>
            </button>
          ))}

          {filteredBlocks.length === 0 && (
            <div className={s.emptyState}>
              {`No blocks found matching "${searchTerm}"`}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
