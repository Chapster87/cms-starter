"use client"

import React, { useState } from "react"

import Button from "@/components/button"
import FieldWrapper from "../field-wrapper"

import s from "./style.module.css"

interface MediaAsset {
  url: string
  name: string
  type: string
  size?: number
}

interface MediaFieldProps {
  label: string
  value: string | MediaAsset[] // JSON string or array of assets
  onChange: (value: string) => void
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
  name?: string
  multiple?: boolean
}

/**
 * A specialized field for selecting media assets.
 * Currently a visual placeholder that supports adding URLs.
 */
export default function MediaField({
  label,
  value,
  onChange,
  description,
  fieldNote,
  required,
  disabled,
  name,
  multiple = false,
}: MediaFieldProps) {
  const id = React.useId()
  const [urlInput, setUrlInput] = useState("")

  const assets: MediaAsset[] = React.useMemo(() => {
    if (!value) return []
    if (Array.isArray(value)) return value
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return []
    }
  }, [value])

  const handleAddUrl = () => {
    if (!urlInput) return
    const newAsset: MediaAsset = {
      url: urlInput,
      name: urlInput.split("/").pop() || "Asset",
      type: "image/unknown",
    }

    const newAssets = multiple ? [...assets, newAsset] : [newAsset]
    onChange(JSON.stringify(newAssets))
    setUrlInput("")
  }

  const handleRemove = (index: number) => {
    const newAssets = assets.filter((_, i) => i !== index)
    onChange(JSON.stringify(newAssets))
  }

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <div className={s.mediaContainer}>
        <div className={s.assetGrid}>
          {assets.map((asset, index) => (
            <div key={index} className={s.assetCard}>
              <div className={s.preview}>
                {asset.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                  <img src={asset.url} alt={asset.name} />
                ) : (
                  <div className={s.fileIcon}>📄</div>
                )}
              </div>
              <div className={s.assetInfo}>
                <span className={s.assetName}>{asset.name}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  className={s.removeButton}
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
          {(multiple || assets.length === 0) && (
            <div className={s.addPlaceholder}>
              <div className={s.urlInputRow}>
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className={s.urlInput}
                  disabled={disabled}
                />
                <Button
                  type="button"
                  onClick={handleAddUrl}
                  className={s.addButton}
                  disabled={disabled || !urlInput}
                >
                  Add
                </Button>
              </div>
              <p className={s.hint}>
                @TODO: Implement Supabase Storage Uploader
              </p>
            </div>
          )}
        </div>
      </div>
    </FieldWrapper>
  )
}
