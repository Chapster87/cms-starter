"use client"

import { Type, Layers, ExternalLink, Database } from "lucide-react"

import Button from "@/components/button"
import Tabs from "@/components/tabs"
import { FIELD_DEFINITIONS } from "@/utils/field-types"

import s from "./style.module.css"

interface FieldTypeGridProps {
  onSelect: (type: string) => void
}

/**
 * Stage 1 of the field creator: A grid of cards for selecting a field type.
 */
export default function FieldTypeGrid({ onSelect }: FieldTypeGridProps) {
  const categories = [
    { id: "basic", label: "Basic", icon: <Type size={14} /> },
    { id: "content", label: "Content", icon: <Layers size={14} /> },
    { id: "relational", label: "Relational", icon: <ExternalLink size={14} /> },
    { id: "advanced", label: "Advanced", icon: <Database size={14} /> },
  ]

  return (
    <Tabs defaultValue="basic" className={s.typeTabs}>
      <Tabs.List className={s.tabsList}>
        {categories.map((cat) => (
          <Tabs.Trigger key={cat.id} value={cat.id} className={s.tabTrigger}>
            {cat.icon} {cat.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {categories.map((cat) => (
        <Tabs.Content key={cat.id} value={cat.id} className={s.tabsContent}>
          <div className={s.typeGrid}>
            {FIELD_DEFINITIONS.filter((f) => f.category === cat.id).map(
              (field) => (
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
              )
            )}
          </div>
        </Tabs.Content>
      ))}
    </Tabs>
  )
}
