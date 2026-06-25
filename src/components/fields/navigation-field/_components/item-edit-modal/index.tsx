import React, { useState } from "react"
import { NavigationItem } from "@/types/cms-generated"
import Modal from "@/components/modal"
import { ReferenceField, TextField, CheckboxField } from "@/components/fields"
import Button from "@/components/button"
import s from "./style.module.css"

interface ItemEditModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  item: NavigationItem
  onSave: (item: NavigationItem) => void
  allowedModels: string[]
  isNew?: boolean
}

/**
 * Modal component for creating or editing navigation items.
 */
export default function ItemEditModal({
  isOpen,
  onOpenChange,
  item: initialItem,
  onSave,
  allowedModels,
  isNew,
}: ItemEditModalProps) {
  const [localItem, setLocalItem] = useState<NavigationItem>(initialItem)

  /**
   * Updates local state with provided changes.
   */
  const handleUpdate = (updates: Partial<NavigationItem>) => {
    setLocalItem((prev) => ({ ...prev, ...updates }))
  }

  /**
   * Resets type-specific fields when the navigation type changes.
   */
  const handleTypeChange = (type: NavigationItem["type"]) => {
    handleUpdate({ type })
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={isNew ? "Add Navigation Item" : "Edit Navigation Item"}
      className={s.editModal}
    >
      <div className={s.modalContent}>
        <div className={s.typeSelector}>
          {(["internal", "external", "static"] as const).map((t) => (
            <Button
              variant="secondary"
              unstyled
              key={t}
              type="button"
              className={localItem.type === t ? s.activeType : ""}
              onClick={() => handleTypeChange(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

        {localItem.type === "internal" && (
          <ReferenceField
            label="Linked Record"
            value={localItem.linkedRecord?.id || null}
            onChange={(val) => {
              const id = Array.isArray(val) ? val[0] : val
              if (!id) {
                handleUpdate({ linkedRecord: undefined })
              }
            }}
            onSelectRecord={(record) => {
              handleUpdate({
                linkedRecord: {
                  id: record.id,
                  modelId: record.model_id || "",
                  displayName: record.display_name,
                  slug: record.subtitle,
                },
              })
            }}
            allowedModels={allowedModels}
          />
        )}

        {localItem.type === "external" && (
          <div className={s.externalFields}>
            <TextField
              label="URL"
              value={localItem.url || ""}
              onChange={(e) => handleUpdate({ url: e.target.value })}
              placeholder="https://..."
            />
            <div className={s.toggleRow}>
              <CheckboxField
                label="Open in new tab"
                checked={!!localItem.openInNewTab}
                onChange={(checked) => handleUpdate({ openInNewTab: checked })}
              />
              <CheckboxField
                label="No follow"
                checked={!!localItem.noFollow}
                onChange={(checked) => handleUpdate({ noFollow: checked })}
              />
            </div>
          </div>
        )}

        {localItem.type === "static" && (
          <TextField
            label="Route Path"
            value={localItem.routePath || ""}
            onChange={(e) => handleUpdate({ routePath: e.target.value })}
            placeholder="/contact"
          />
        )}

        <TextField
          label={localItem.type === "internal" ? "Label Override" : "Label"}
          value={localItem.labelOverride || ""}
          onChange={(e) => handleUpdate({ labelOverride: e.target.value })}
          placeholder="Defaults to record title if internal"
        />

        <div className={s.modalFooter}>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(localItem)}>
            {isNew ? "Create Item" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
