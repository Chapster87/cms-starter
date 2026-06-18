"use client"

import { useState, useEffect, useMemo } from "react"
import clsx from "clsx"
import {
  FileText,
  Type,
  Layers,
  Database,
  ExternalLink,
  Plus,
} from "lucide-react"

import Button from "@/components/button"
import { TextField, SelectField, CheckboxField } from "@/components/fields"
import Modal from "@/components/modal"
import Tabs from "@/components/tabs"
import { CMSField } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"

import s from "./style.module.css"

interface FieldModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  modelId: string
  accessToken: string | null
  field?: CMSField | null // If present, we are in edit or duplicate mode
  mode?: "create" | "edit" | "duplicate"
}

/**
 * A reusable modal for creating, editing, and duplicating model fields.
 */
export default function FieldModal({
  isOpen,
  onOpenChange,
  onSuccess,
  modelId,
  accessToken,
  field,
  mode = "create",
}: FieldModalProps) {
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState(FIELD_DEFINITIONS[0].type)
  const [isRequired, setIsRequired] = useState(false)
  const [isUnique, setIsUnique] = useState(false)
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to move state updates out of the synchronous render cycle
      // resolving cascading render warnings from ESLint/Next.js
      const timer = setTimeout(() => {
        if (field) {
          if (mode === "edit") {
            setLabel(field.field_label)
            setName(field.field_name)
            setType(field.field_type)
            setIsRequired(field.is_required)
            setIsUnique(field.is_unique)
            setSettings(field.settings || {})
            setNote(field.field_note || "")
          } else if (mode === "duplicate") {
            setLabel(`${field.field_label} (copy)`)
            setName(`${field.field_name}_copy`)
            setType(field.field_type)
            setIsRequired(field.is_required)
            setIsUnique(field.is_unique)
            setSettings(field.settings || {})
            setNote(field.field_note || "")
          }
        } else {
          // Reset for new field
          setLabel("")
          setName("")
          setType(FIELD_DEFINITIONS[0].type)
          setIsRequired(false)
          setIsUnique(false)
          setSettings({})
          setNote("")
        }
        setError(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, field, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    setIsSaving(true)
    setError(null)

    try {
      const isEdit = mode === "edit"
      const url = "/api/models/schema/fields"
      const method = isEdit ? "PATCH" : "POST"

      const body = isEdit
        ? {
            id: field?.id,
            field_label: label,
            field_note: note,
            is_required: isRequired,
            is_unique: isUnique,
            settings: settings,
          }
        : {
            model_id: modelId,
            field_name: name || label.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            field_label: label,
            field_type: type,
            is_required: isRequired,
            is_unique: isUnique,
            settings: settings,
          }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${mode} field`)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} field`)
    } finally {
      setIsSaving(true) // Keep it true until modal closes to prevent double clicks
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  const title =
    mode === "edit"
      ? "Edit Field"
      : mode === "duplicate"
        ? "Duplicate Field"
        : "Add New Field"
  const description =
    mode === "edit"
      ? "Update the configuration for this field."
      : "Define the attributes for this field."

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      {error && <p className={s.errorText}>{error}</p>}

      <form onSubmit={handleSubmit} className={s.modalForm}>
        <TextField
          label="Field Label"
          placeholder="e.g. Featured Image"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          description="Human-friendly name for the field."
        />

        {mode !== "edit" && (
          <>
            <TextField
              label="Field Name (Database Column)"
              placeholder="e.g. featured_image"
              value={name}
              onChange={(e) => setName(e.target.value)}
              description="The physical column name in your database."
            />

            <div className={s.typeSelection}>
              <label className={s.fieldLabel}>Field Type</label>
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
                    <Tabs.Content
                      key={cat}
                      value={cat}
                      className={s.tabsContent}
                    >
                      <div className={s.typeGrid}>
                        {FIELD_DEFINITIONS.filter(
                          (def) => def.category === cat
                        ).map((def) => (
                          <button
                            key={def.type}
                            type="button"
                            className={clsx(
                              s.typeCard,
                              type === def.type && s.active
                            )}
                            onClick={() => setType(def.type)}
                          >
                            <div className={s.typeCardIcon}>
                              {/* In a real app we'd map def.icon to a Lucide component */}
                              <FileText size={20} />
                            </div>
                            <div className={s.typeCardInfo}>
                              <div className={s.typeCardLabel}>{def.label}</div>
                              <div className={s.typeCardDesc}>
                                {def.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </Tabs.Content>
                  )
                )}
              </Tabs>
            </div>
          </>
        )}

        {mode === "edit" && (
          <TextField
            label="Field Note"
            placeholder="e.g. This image is used on the home page."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            description="Internal description or help text for editors."
          />
        )}

        <CheckboxField
          label="Required Field"
          checked={isRequired}
          onChange={setIsRequired}
          description="Make this field mandatory."
          variant="switch"
        />

        <CheckboxField
          label="Unique Constraint"
          checked={isUnique}
          onChange={setIsUnique}
          description="Prevent duplicate values in this column."
          variant="switch"
        />

        {type === "media" && (
          <CheckboxField
            label="Multiple Assets"
            checked={!!settings.allow_multiple}
            onChange={(val) =>
              setSettings((prev) => ({ ...prev, allow_multiple: val }))
            }
            description="Allow multiple images or files to be uploaded."
            variant="switch"
          />
        )}

        <div className={s.modalActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={isSaving}>
            {mode === "edit"
              ? "Update Field"
              : mode === "duplicate"
                ? "Create Duplicate"
                : "Create Field"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
