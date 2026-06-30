"use client"

import clsx from "clsx"
import { Type, Layers, ExternalLink, Database, FileText } from "lucide-react"

import Tabs from "@/components/tabs"
import { FIELD_DEFINITIONS } from "@/utils/field-types"
import { CMSFieldType } from "@/types/fields"

import s from "../style.module.css"

interface StepTypeSelectorProps {
  selectedType: CMSFieldType
  onSelect: (type: CMSFieldType) => void
}

/**
 * Step 1: Selection of the field type from categorized tabs.
 */
export default function StepTypeSelector({
  selectedType,
  onSelect,
}: StepTypeSelectorProps) {
  return (
    <div className={s.typeSelection}>
      <label className={s.fieldLabel}>Choose Field Type</label>
      <Tabs defaultValue="basic" className={s.typeTabs}>
        <Tabs.List className={s.tabsList}>
          <Tabs.Trigger value="basic" className={s.tabTrigger}>
            <Type size={14} /> Basic
          </Tabs.Trigger>
          <Tabs.Trigger value="content" className={s.tabTrigger}>
            <Layers size={14} /> Content
          </Tabs.Trigger>
          <Tabs.Trigger value="relational" className={s.tabTrigger}>
            <ExternalLink size={14} /> Relational
          </Tabs.Trigger>
          <Tabs.Trigger value="advanced" className={s.tabTrigger}>
            <Database size={14} /> Advanced
          </Tabs.Trigger>
        </Tabs.List>

        {(["basic", "content", "relational", "advanced"] as const).map(
          (cat) => (
            <Tabs.Content key={cat} value={cat} className={s.tabsContent}>
              <div className={s.typeGrid}>
                {FIELD_DEFINITIONS.filter((def) => def.category === cat).map(
                  (def) => (
                    <button
                      key={def.type}
                      type="button"
                      className={clsx(
                        s.typeCard,
                        selectedType === def.type && s.active
                      )}
                      onClick={() => onSelect(def.type)}
                    >
                      <div className={s.typeCardIcon}>
                        <FileText size={20} />
                      </div>
                      <div className={s.typeCardInfo}>
                        <div className={s.typeCardLabel}>{def.label}</div>
                        <div className={s.typeCardDesc}>{def.description}</div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </Tabs.Content>
          )
        )}
      </Tabs>
    </div>
  )
}
