"use client"

import React, { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Image as ImageIcon, Loader2, Search, Upload } from "lucide-react"
import { clsx } from "clsx"

import Button from "@/components/button"
import Modal from "@/components/modal"
import { mediaService } from "@/client/media-service"
import { storageFactory } from "@/client/storage-factory"
import { useCloudinaryWidget } from "@/hooks/use-cloudinary-widget"
import { MediaAsset } from "@/types/cms-generated"
import MediaDetailsModal from "@/app/media/_components/media-details-modal"

import s from "./style.module.css"

interface MediaBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (assets: MediaAsset[]) => void
  multiple?: boolean
}

/**
 * A comprehensive media browser and uploader modal.
 */
export default function MediaBrowser({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
}: MediaBrowserProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [importing, setImporting] = useState(false)
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null)

  // 1. Fetch assets
  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await mediaService.getAssets()
      setAssets(data)
    } catch (error) {
      console.error("Failed to load assets", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const { openWidget } = useCloudinaryWidget(() => {
    fetchAssets()
  })

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      if (isOpen && isMounted) {
        setLoading(true)
        try {
          const data = await mediaService.getAssets()
          if (isMounted) {
            setAssets(data)
            setSelectedIds([])
          }
        } catch (error) {
          console.error("Failed to load assets", error)
        } finally {
          if (isMounted) {
            setLoading(false)
          }
        }
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  // 2. Handle selection
  const toggleSelection = (id: string) => {
    if (multiple) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      )
    } else {
      setSelectedIds([id])
    }
  }

  const handleConfirm = () => {
    const selectedAssets = assets.filter((a) => selectedIds.includes(a.id))
    onSelect(selectedAssets)
    onClose()
  }

  // 3. Handle upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const adapter = storageFactory.getAdapter()
      const uploadPromises = Array.from(files).map(async (file) => {
        const metadata = await adapter.upload(file)
        return mediaService.registerAsset(metadata)
      })

      await Promise.all(uploadPromises)
      await fetchAssets()
    } catch (error) {
      console.error("Upload failed", error)
    } finally {
      setUploading(false)
    }
  }

  // 4. Drag and Drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleUpload(e.dataTransfer.files)
  }

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Media Library"
      description="Upload and manage your project assets."
      className={s.modalWidth}
    >
      <div className={s.mediaBrowser}>
        <div className={s.toolbar}>
          <div className={s.filters}>
            <div className={s.searchWrapper}>
              <Search size={16} className={s.searchIcon} />
              <input
                type="text"
                placeholder="Search assets..."
                className={s.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={s.uploadAction}>
            <Button
              variant="secondary"
              size="small"
              onClick={openWidget}
              title="Browse existing Cloudinary assets"
            >
              <ImageIcon size={16} />
              Cloudinary
            </Button>

            <div className={s.importWrapper}>
              <input
                type="text"
                placeholder="Import Cloudinary URL..."
                className={s.importInput}
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
              <Button
                variant="secondary"
                size="small"
                onClick={async () => {
                  if (!importUrl) return
                  setImporting(true)
                  try {
                    const res = await fetch("/api/media/fetch-metadata", {
                      method: "POST",
                      body: JSON.stringify({ url: importUrl }),
                    })
                    const metadata = await res.json()
                    if (metadata.error) throw new Error(metadata.error)
                    await mediaService.registerAsset(metadata)
                    await fetchAssets()
                    setImportUrl("")
                  } catch (e) {
                    console.error("Import failed", e)
                    alert("Import failed. Ensure it is a valid Cloudinary URL.")
                  } finally {
                    setImporting(false)
                  }
                }}
                disabled={importing || !importUrl}
              >
                {importing ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  "Import"
                )}
              </Button>
            </div>

            <input
              type="file"
              id="media-upload"
              hidden
              multiple={multiple}
              accept="image/*"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              variant="primary"
              onClick={() => document.getElementById("media-upload")?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Upload size={18} />
              )}
              Upload
            </Button>
          </div>
        </div>

        <div
          className={clsx(s.browserContent, isDragging && s.dragging)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {uploading && (
            <div className={s.loadingOverlay}>
              <Loader2 className="animate-spin" size={32} />
            </div>
          )}

          {filteredAssets.length === 0 && !loading && (
            <div className={s.emptyState}>
              <ImageIcon size={48} />
              <p>No assets found. Drag and drop files here to upload.</p>
            </div>
          )}

          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={clsx(
                s.assetCard,
                selectedIds.includes(asset.id) && s.selected
              )}
              onClick={() => toggleSelection(asset.id)}
              onDoubleClick={() => setEditingAsset(asset)}
              title="Double click to edit metadata"
            >
              <div className={s.preview}>
                <Image
                  src={asset.url}
                  alt={asset.name}
                  fill
                  className={s.previewImage}
                  unoptimized
                />
              </div>
              <div className={s.assetInfo}>
                <span className={s.assetName}>{asset.name}</span>
                <span className={s.assetMeta}>
                  {asset.width && asset.height
                    ? `${asset.width}×${asset.height} • `
                    : ""}
                  {(asset.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={s.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
          >
            Select {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </div>
      </div>

      <MediaDetailsModal
        isOpen={!!editingAsset}
        asset={editingAsset}
        onClose={() => setEditingAsset(null)}
        onUpdate={fetchAssets}
      />
    </Modal>
  )
}
