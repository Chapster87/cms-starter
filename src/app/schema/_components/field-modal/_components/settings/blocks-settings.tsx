"use client"

import clsx from "clsx"
import { CMSBlock } from "@/types/fields"
import s from "../../style.module.css"

interface BlocksSettingsProps {
  availableBlocks: CMSBlock[]
  allowedBlocks: string[]
  setAllowedBlocks: (ids: string[]) => void
}

export default function BlocksSettings({
  availableBlocks,
  allowedBlocks,
  setAllowedBlocks,
}: BlocksSettingsProps) {
  return (
    <div className={s.blockSelection}>
      <label className={s.fieldLabel}>Allowed Blocks</label>
      <div className={s.blockGrid}>
        {availableBlocks.map((block) => (
          <button
            key={block.id}
            type="button"
            className={clsx(
              s.blockCard,
              allowedBlocks.includes(block.id) && s.active
            )}
            onClick={() => {
              const next = allowedBlocks.includes(block.id)
                ? allowedBlocks.filter((id) => id !== block.id)
                : [...allowedBlocks, block.id]
              setAllowedBlocks(next)
            }}
          >
            <span className={s.blockEmoji}>{block.emoji || "📦"}</span>
            <span className={s.blockLabel}>{block.label}</span>
          </button>
        ))}
      </div>
      {availableBlocks.length === 0 && (
        <p className={s.emptyText}>No blocks defined yet.</p>
      )}
    </div>
  )
}
