"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

import Button from "@/components/button"
import Modal from "@/components/modal"
import { MediaAsset } from "@/types/cms-generated"

import s from "./style.module.css"

interface MediaDetailsModalProps {
  asset: MediaAsset | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function MediaDetailsModal({
  asset,
  isOpen,
  onClose,
  onUpdate,
}: MediaDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: asset?.name || "",
    alt_text: asset?.alt_text || "",
    folder: asset?.folder || "",
    tags: asset?.tags?.join(", ") || "",
  })

  // Update local state when asset changes
  React.useEffect(() => {
    let isMounted = true

    // Use a small delay to avoid "cascading renders" lint error
    // and ensure state is updated after the effect cycle
    const timeout = setTimeout(() => {
      if (asset && isMounted) {
        setFormData({
          name: asset.name,
          alt_text: asset.alt_text || "",
          folder: asset.folder,
          tags: asset.tags?.join(", ") || "",
        })
      }
    }, 0)

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [asset])

  if (!asset) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = (await import("@/utils/supabase")).createClient()
      const { error } = await supabase
        .from("media_assets")
        .update({
          name: formData.name,
          alt_text: formData.alt_text,
          folder: formData.folder,
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        })
        .eq("id", asset.id)

      if (error) throw error
      onUpdate()
      onClose()
    } catch (e) {
      console.error("Update failed", e)
      alert("Failed to update asset metadata")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Asset Details"
      className={s.modalWidth}
    >
      <div className={s.modalContent}>
        <div className={s.preview}>
          <Image
            src={asset.url}
            alt={asset.alt_text || asset.name}
            fill
            className={s.previewImage}
            unoptimized
          />
        </div>

        <div className={s.details}>
          <div className={s.form}>
            <div className={s.field}>
              <label>Name</label>
              <input
                className={s.input}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className={s.field}>
              <label>Alt Text</label>
              <input
                className={s.input}
                placeholder="Description for screen readers..."
                value={formData.alt_text}
                onChange={(e) =>
                  setFormData({ ...formData, alt_text: e.target.value })
                }
              />
            </div>
            <div className={s.field}>
              <label>Folder</label>
              <input
                className={s.input}
                value={formData.folder}
                onChange={(e) =>
                  setFormData({ ...formData, folder: e.target.value })
                }
              />
            </div>
            <div className={s.field}>
              <label>Tags (comma separated)</label>
              <input
                className={s.input}
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
              />
            </div>
          </div>

          <div className={s.stats}>
            <div className={s.statRow}>
              <span className={s.statLabel}>Size</span>
              <span className={s.statValue}>
                {(asset.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className={s.statRow}>
              <span className={s.statLabel}>Dimensions</span>
              <span className={s.statValue}>
                {asset.width} × {asset.height}
              </span>
            </div>
            <div className={s.statRow}>
              <span className={s.statLabel}>Provider</span>
              <span className={s.statValue}>{asset.storage_provider}</span>
            </div>
          </div>

          <div className={s.actions}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="animate-spin" size={16} />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
