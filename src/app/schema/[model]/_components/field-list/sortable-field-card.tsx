import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import ContextMenu from "@/components/context-menu"
import SvgIcon from "@/components/svg-icon"
import { CMSField } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"

import s from "./style.module.css"

interface SortableFieldCardProps {
  field: CMSField
  getIconCategory: (type: string) => string
  onEdit: (field: CMSField) => void
  onDuplicate: (field: CMSField) => void
  onDelete: (field: CMSField) => void
}

export function SortableFieldCard({
  field,
  getIconCategory,
  onEdit,
  onDuplicate,
  onDelete,
}: SortableFieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  }

  const definition = FIELD_DEFINITIONS.find((d) => d.type === field.field_type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${s.fieldCard} ${isDragging ? s.isDragging : ""}`}
    >
      <div className={s.dragHandle} {...attributes} {...listeners}>
        <SvgIcon icon="menu" size={20} />
      </div>

      <div className={`${s.fieldIcon} ${getIconCategory(field.field_type)}`}>
        {field.field_type === "json" ? "{...}" : "A"}
      </div>

      <div className={s.fieldContent}>
        <div className={s.fieldMainInfo}>
          <span
            className={`${s.fieldLabel} ${
              field.is_required ? s.fieldLabelRequired : ""
            }`}
          >
            {field.field_label}
          </span>
          <span className={s.fieldName}>{field.field_name}</span>
        </div>
        <div className={s.fieldTypeLabel}>
          {definition?.label || field.field_type}
        </div>
      </div>

      <div className={s.fieldActions}>
        <div className={s.fieldBadges}>
          {field.is_unique && <span className={s.uniqueBadge}>Unique</span>}
          {field.is_system && <span className={s.systemBadge}>System</span>}
        </div>

        <button
          className={s.editFieldButton}
          onClick={() => onEdit(field)}
          type="button"
        >
          Edit field
        </button>

        <ContextMenu>
          <ContextMenu.Trigger className={s.menuTrigger}>
            <button type="button" aria-label="More options">
              <SvgIcon icon="more-vertical" size={20} />
            </button>
          </ContextMenu.Trigger>

          <ContextMenu.Content>
            <ContextMenu.Item onSelect={() => onDuplicate(field)}>
              Duplicate
            </ContextMenu.Item>
            {!field.is_system && (
              <ContextMenu.Item
                onSelect={() => onDelete(field)}
                variant="danger"
              >
                Delete
              </ContextMenu.Item>
            )}
          </ContextMenu.Content>
        </ContextMenu>
      </div>
    </div>
  )
}
