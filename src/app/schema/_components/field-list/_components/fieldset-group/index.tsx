import { CSS } from "@dnd-kit/utilities"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import clsx from "clsx"
import { CMSField, CMSFieldset } from "@/types/fields"
import { SortableFieldCard } from "../sortable-field-card"
import { SortableFieldsetCard } from "../sortable-fieldset-card"
import s from "../../style.module.css"

interface FieldsetGroupProps {
  fieldset: CMSFieldset
  fields: CMSField[]
  isOver: boolean
  onEditFieldset: (fs: CMSFieldset) => void
  onDeleteFieldset: (fs: CMSFieldset) => void
  onEditField: (field: CMSField) => void
  onDuplicateField: (field: CMSField) => void
  onDeleteField: (field: CMSField) => void
  getIconCategory: (type: string) => string
}

/**
 * Renders a sortable fieldset and its nested fields.
 * Manages its own sortable context for the fields it contains.
 */
export function FieldsetGroup({
  fieldset,
  fields,
  isOver,
  onEditFieldset,
  onDeleteFieldset,
  onEditField,
  onDuplicateField,
  onDeleteField,
  getIconCategory,
}: FieldsetGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldset.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  }

  const fieldsInGroup = fields.filter((f) => f.fieldset_id === fieldset.id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        s.fieldsetGroup,
        isOver && s.isOver,
        isDragging && s.dragging
      )}
    >
      <SortableFieldsetCard
        fieldset={fieldset}
        onEdit={onEditFieldset}
        onDelete={onDeleteFieldset}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
      <div className={s.groupNestedFields}>
        <SortableContext
          items={fieldsInGroup.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {fieldsInGroup.map((field) => (
            <SortableFieldCard
              key={field.id}
              field={field}
              getIconCategory={getIconCategory}
              onEdit={onEditField}
              onDuplicate={onDuplicateField}
              onDelete={onDeleteField}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
