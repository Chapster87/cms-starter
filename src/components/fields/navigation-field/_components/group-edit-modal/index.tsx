import React, { useState } from "react"
import { NavigationItem } from "@/types/cms-generated"
import Modal from "@/components/modal"
import { TextField } from "@/components/fields"
import Button from "@/components/button"
import s from "../item-edit-modal/style.module.css"

interface GroupEditModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  item: NavigationItem
  onSave: (item: NavigationItem) => void
  isNew?: boolean
}

/**
 * Modal component specifically for creating or editing navigation groups.
 */
export default function GroupEditModal({
  isOpen,
  onOpenChange,
  item: initialItem,
  onSave,
  isNew,
}: GroupEditModalProps) {
  const [localItem, setLocalItem] = useState<NavigationItem>(initialItem)

  /**
   * Updates local state with provided changes.
   */
  const handleUpdate = (updates: Partial<NavigationItem>) => {
    setLocalItem((prev) => ({ ...prev, ...updates }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={isNew ? "Add Navigation Group" : "Edit Navigation Group"}
      className={s.editModal}
    >
      <div className={s.modalContent}>
        <TextField
          label="Group Name"
          value={localItem.labelOverride || ""}
          onChange={(e) => handleUpdate({ labelOverride: e.target.value })}
          placeholder="e.g. Products"
          autoFocus
        />

        <div className={s.modalFooter}>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(localItem)}>
            {isNew ? "Create Group" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
