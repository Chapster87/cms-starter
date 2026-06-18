"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Search, ChevronDown, FileText, Check, User } from "lucide-react"

import Button from "@/components/button"
import Modal from "@/components/modal"
import { useAuth } from "@/hooks/use-auth"
import FieldWrapper from "../field-wrapper"

import s from "./style.module.css"

interface ReferenceFieldProps {
  label: string
  value: string | string[] | null
  onChange: (value: string | string[] | null) => void
  onSelectRecord?: (record: RecordPreview) => void
  allowedModels: string[]
  allowMultiple?: boolean
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  filters?: Record<string, Record<string, unknown>>
  excludeIds?: string[]
  triggerRef?: React.RefObject<HTMLDivElement | null>
}

interface RecordPreview {
  id: string
  display_name: string
  subtitle?: string
  model_name: string
  model_id?: string
  status?: string
  has_draft?: boolean
}

/**
 * A professional reference field for linking records with a browse modal.
 */
export default function ReferenceField({
  label,
  value,
  onChange,
  onSelectRecord,
  allowedModels,
  allowMultiple = false,
  description,
  fieldNote,
  required,
  disabled,
  placeholder = "Select records...",
  filters,
  excludeIds,
  triggerRef,
}: ReferenceFieldProps) {
  const { accessToken } = useAuth()
  const id = React.useId()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [allRecords, setAllRecords] = useState<RecordPreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState<RecordPreview[]>([])

  // Parse initial value
  const selectedIds: string[] = React.useMemo(() => {
    if (!value) return []
    if (Array.isArray(value)) return value
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return typeof value === "string" ? [value] : []
    }
  }, [value])

  // Fetch previews for selected IDs
  useEffect(() => {
    const fetchSelectedPreviews = async () => {
      if (!accessToken || selectedIds.length === 0) {
        setSelectedRecords([])
        return
      }

      try {
        const response = await fetch(`/api/records/previews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ids: selectedIds,
            allowedModels: allowedModels,
          }),
        })
        if (response.ok) {
          const data = await response.json()
          setSelectedRecords(data)
        }
      } catch (err) {
        console.error("Error fetching reference previews:", err)
      }
    }
    fetchSelectedPreviews()
  }, [accessToken, selectedIds])

  // Fetch all available records for the browser
  const fetchRecords = useCallback(async () => {
    if (!accessToken || !allowedModels || allowedModels.length === 0) {
      setAllRecords([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/records/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ models: allowedModels, filters, excludeIds }),
      })
      if (response.ok) {
        const data = await response.json()
        setAllRecords(data)
      } else {
        const errorData = await response.json()
        console.error("ReferenceField: List API error:", errorData)
      }
    } catch (err) {
      console.error("ReferenceField: Fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, allowedModels])

  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        fetchRecords()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isModalOpen, fetchRecords])

  const handleSelect = (record: RecordPreview) => {
    onSelectRecord?.(record)

    if (allowMultiple) {
      const isAlreadySelected = selectedIds.includes(record.id)
      const newValue = isAlreadySelected
        ? selectedIds.filter((id) => id !== record.id)
        : [...selectedIds, record.id]
      onChange(newValue.length > 0 ? newValue : null)
    } else {
      onChange([record.id])
      setIsModalOpen(false)
    }
  }

  const handleRemove = (recordId: string) => {
    const newValue = selectedIds.filter((id) => id !== recordId)
    onChange(newValue.length > 0 ? newValue : null)
  }

  const filteredRecords = allRecords.filter(
    (r) =>
      !searchTerm ||
      r.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.model_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <div className={s.referenceContainer} ref={triggerRef}>
        <div
          className={`${s.selectionArea} ${disabled ? s.disabled : ""}`}
          onClick={() => !disabled && setIsModalOpen(true)}
        >
          <div className={s.pillList}>
            {selectedRecords.map((record) => (
              <span key={record.id} className={s.pill}>
                <span className={s.pillModel}>{record.model_name}:</span>
                {record.display_name}
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  unstyled
                  className={s.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(record.id)
                  }}
                  disabled={disabled}
                >
                  ✕
                </Button>
              </span>
            ))}
            {selectedRecords.length === 0 && (
              <span className={s.placeholder}>{placeholder}</span>
            )}
          </div>
          <div className={s.browseIcon}>
            <ChevronDown size={16} />
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open)
            if (!open) setSearchTerm("")
          }}
          title={`Select ${label}`}
          className={s.browseModal}
        >
          <div className={s.modalContent}>
            <div className={s.searchWrapper}>
              <Search className={s.searchIcon} size={18} />
              <input
                type="text"
                className={s.modalSearch}
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className={s.recordList}>
              {isLoading && allRecords.length === 0 ? (
                <div className={s.statusMessage}>Loading records...</div>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id)
                  return (
                    <div
                      key={record.id}
                      className={`${s.recordItem} ${isSelected ? s.selected : ""}`}
                      onClick={() => handleSelect(record)}
                    >
                      <div className={s.recordIcon}>
                        {record.model_id === "users" ? (
                          <User size={20} />
                        ) : (
                          <FileText size={20} />
                        )}
                      </div>
                      <div className={s.recordMeta}>
                        <div className={s.recordTitle}>
                          {record.display_name}
                        </div>
                        {record.subtitle && (
                          <div className={s.recordSubtitle}>
                            {record.model_id === "users"
                              ? record.subtitle
                              : `Slug: /${record.subtitle}`}
                          </div>
                        )}
                      </div>
                      <div className={s.recordType}>
                        <span className={s.typeBadge}>{record.model_name}</span>
                        {record.model_id !== "users" && (
                          <div className={s.statusDots}>
                            {record.status === "published" ? (
                              <span
                                className={`${s.statusDot} ${s.published}`}
                                title="Published"
                              />
                            ) : (
                              <span
                                className={`${s.statusDot} ${s.draft}`}
                                title="Draft"
                              />
                            )}
                            {record.status === "published" &&
                              record.has_draft && (
                                <span
                                  className={`${s.statusDot} ${s.changed}`}
                                  title="Unpublished Changes"
                                />
                              )}
                          </div>
                        )}
                      </div>
                      {allowMultiple && isSelected && (
                        <div className={s.checkIcon}>
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className={s.statusMessage}>No records found</div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </FieldWrapper>
  )
}
