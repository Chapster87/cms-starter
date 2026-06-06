"use client"

import Button from "@/components/button"
import { FIELD_DEFINITIONS } from "@/utils/field-types"
import s from "./style.module.css"

interface FieldTypeGridProps {
  onSelect: (type: string) => void
}

/**
 * Stage 1 of the field creator: A grid of cards for selecting a field type.
 */
export default function FieldTypeGrid({ onSelect }: FieldTypeGridProps) {
  return (
    <div className={s.typeGrid}>
      {FIELD_DEFINITIONS.map((field) => (
        <Button
          variant="secondary"
          unstyled
          key={field.type}
          type="button"
          className={s.typeCard}
          onClick={() => onSelect(field.type)}
        >
          <div className={s.typeIcon}>
            <svg>
              <use xlinkHref={`/feather-sprite.svg#${field.icon}`} />
            </svg>
          </div>
          <div className={s.typeMeta}>
            <span className={s.typeLabel}>{field.label}</span>
            <p className={s.typeDescription}>{field.description}</p>
          </div>
        </Button>
      ))}
    </div>
  )
}
