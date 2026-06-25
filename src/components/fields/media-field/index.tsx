"use client"

import React, { useState } from "react"

import Button from "@/components/button"
import { MediaAsset } from "@/types/cms-generated"
import FieldWrapper from "../field-wrapper"
import MediaBrowser from "./media-browser"

import s from "./style.module.css"

interface MediaFieldProps {
  label: string
  value: string | MediaAsset | MediaAsset[] // JSON string, object, or array of assets
  onChange: (value: MediaAsset | MediaAsset[] | null) => void
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
  const [isBrowserOpen, setIsBrowserOpen] = useState(false)

  const assets: MediaAsset[] = React.useMemo(() => {
    if (!value) return []
    if (Array.isArray(value)) return value
    if (typeof value === "object") return [value as MediaAsset]
    try {
      const parsed = JSON.parse(value as string)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return []
    }
  }, [value])

  const handleSelect = (selectedAssets: MediaAsset[]) => {
    if (multiple) {
      onChange([...assets, ...selectedAssets])
    } else {
      onChange(selectedAssets[0])
    }
  }

  const handleRemove = (index: number) => {
    const newAssets = assets.filter((_, i) => i !== index)
    if (multiple) {
      onChange(newAssets.length > 0 ? newAssets : null)
    } else {
      onChange(null)
    }
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
                {asset.url &&
                asset.url.match(/\.(jpeg|jpg|gif|png|webp|avif|svg)/i) ? (
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
            <div
              className={s.addPlaceholder}
              onClick={() => setIsBrowserOpen(true)}
            >
              <div className={s.plusIcon}>+</div>
              <p className={s.hint}>Select from Media Library</p>
            </div>
          )}
        </div>
      </div>

      <MediaBrowser
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onSelect={handleSelect}
        multiple={multiple}
      />
    </FieldWrapper>
  )
}
