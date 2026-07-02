import Button from "@/components/button"
import s from "../../style.module.css"

interface FieldListHeaderProps {
  unregisteredCount: number
  isSyncing: boolean
  onSync: () => void
  onAddFieldset: () => void
  onAddNewField: () => void
}

/**
 * Renders the header of the FieldList including title, sync hints, and action buttons.
 */
export function FieldListHeader({
  unregisteredCount,
  isSyncing,
  onSync,
  onAddFieldset,
  onAddNewField,
}: FieldListHeaderProps) {
  return (
    <div className={s.header}>
      <div className={s.headerTitleGroup}>
        <h2>Fields</h2>
        {unregisteredCount > 0 && (
          <span className={s.syncHint}>
            {unregisteredCount} existing columns detected.
            <Button
              variant="secondary"
              size="small"
              onClick={onSync}
              isLoading={isSyncing}
              disabled={isSyncing}
              className={s.syncButton}
            >
              Import them
            </Button>
          </span>
        )}
      </div>
      <div className={s.headerActions} style={{ display: "flex", gap: "8px" }}>
        <Button
          variant="secondary"
          beforeText={<span>+</span>}
          onClick={onAddFieldset}
        >
          Add fieldset
        </Button>
        <Button beforeText={<span>+</span>} onClick={onAddNewField}>
          Add new field
        </Button>
      </div>
    </div>
  )
}
