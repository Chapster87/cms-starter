"use client"

import React, { useState } from "react"

import Button from "@/components/button"
import FieldWrapper from "../field-wrapper"

import s from "./style.module.css"

export interface MediaAsset {
  url: string
  name: string
  type: string
  size?: number
}

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
  const [urlInput, setUrlInput] = useState("")

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

  const handleAddUrl = () => {
    if (!urlInput) return

    let finalUrl = urlInput.trim()
    let finalName = ""

    // Robust check: Did the user paste a JSON snippet?
    // e.g. "team_logo": "[{\"url\": \"...\"}]" or just {"url": "..."}
    if (finalUrl.includes('{"') || finalUrl.includes('["')) {
      try {
        // Try to strip potential key prefix like "field_name":
        const cleanJson = finalUrl.replace(/^[^{[]+:\s*/, "")
        const parsed = JSON.parse(cleanJson)
        const extracted = Array.isArray(parsed) ? parsed[0] : parsed

        if (extracted && typeof extracted === "object" && extracted.url) {
          finalUrl = extracted.url
          finalName = extracted.name || ""
        }
      } catch (e) {
        // Not valid JSON, treat as raw URL
      }
    }

    const newAsset: MediaAsset = {
      url: finalUrl,
      name: finalName || finalUrl.split("/").pop() || "Asset",
      type: "image/unknown",
    }

    if (multiple) {
      onChange([...assets, newAsset])
    } else {
      onChange(newAsset)
    }
    setUrlInput("")
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
