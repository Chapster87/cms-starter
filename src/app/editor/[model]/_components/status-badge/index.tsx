import s from "./style.module.css"

export type RecordStatus = "draft" | "published" | "changed"

interface StatusBadgeProps {
  status: RecordStatus
  isSaving?: boolean
}

export default function StatusBadge({ status, isSaving }: StatusBadgeProps) {
  const getLabel = () => {
    if (isSaving) return "Saving..."
    switch (status) {
      case "draft":
        return "Draft"
      case "published":
        return "Published"
      case "changed":
        return "Changed"
      default:
        return status
    }
  }

  return (
    <div className={`${s.badge} ${s[status]} ${isSaving ? s.saving : ""}`}>
      <span className={s.dot} />
      <span className={s.label}>{getLabel()}</span>
    </div>
  )
}
