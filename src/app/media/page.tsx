"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Image as ImageIcon, Loader2, Search, Upload } from "lucide-react"

import Button from "@/components/button"
import { mediaService } from "@/client/media-service"
import { storageFactory } from "@/client/storage-factory"
import { useCloudinaryWidget } from "@/hooks/use-cloudinary-widget"
import { MediaAsset } from "@/types/media"
import FolderSidebar from "./_components/folder-sidebar"
import MediaDetailsModal from "./_components/media-details-modal"

import s from "./style.module.css"

/**
 * Standalone Media Gallery page for managing project assets.
 */
export default function MediaGalleryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [importUrl, setImportUrl] = useState("")
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [uploadFolder, setUploadFolder] = useState("uploads")
  const [uploadTags, setUploadTags] = useState("")
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null)

  const fetchAssets = useCallback(async () => {
    try {
      const data = await mediaService.getAssets({
        folder: activeFolder || undefined,
      })
      setAssets(data)

      const folderList = await mediaService.getFolders()
      setFolders(folderList)
    } catch (error) {
      console.error("Failed to load assets", error)
    } finally {
      setLoading(false)
    }
  }, [activeFolder])

  const { openWidget } = useCloudinaryWidget(() => {
    fetchAssets()
  })

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [assetsData, folderListData] = await Promise.all([
          mediaService.getAssets({ folder: activeFolder || undefined }),
          mediaService.getFolders(),
        ])

        if (isMounted) {
          setAssets(assetsData)
          setFolders(folderListData)
          setLoading(false)
        }
      } catch (error) {
        console.error("Failed to load assets", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [activeFolder])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const tags = uploadTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      const adapter = storageFactory.getAdapter()
      const uploadPromises = Array.from(files).map(async (file) => {
        const metadata = await adapter.upload(file, {
          folder: uploadFolder,
          tags,
        })
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return

    try {
      await mediaService.deleteAsset(id)
      await fetchAssets()
    } catch (error) {
      console.error("Delete failed", error)
    }
  }

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <main className={s.container}>
      <FolderSidebar
        folders={folders}
        activeFolder={activeFolder}
        onFolderSelect={setActiveFolder}
      />

      <div className={s.mainContent}>
        <header className={s.header}>
          <div>
            <h1 className={s.title}>
              {activeFolder ? `Folder: ${activeFolder}` : "Media Library"}
            </h1>
            <p className={s.subtitle}>
              Manage and organize your project assets.
            </p>
          </div>

          <div className={s.actions}>
            <div className={s.secondaryActions}>
              <Button
                variant="secondary"
                onClick={openWidget}
                title="Browse your Cloudinary account"
              >
                <ImageIcon size={18} />
                Browse Cloudinary
              </Button>

              <div className={s.searchWrapper}>
                <Search size={18} className={s.searchIcon} />
                <input
                  type="text"
                  placeholder="Search assets..."
                  className={s.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className={s.settingsGroup}>
              <div className={s.settingField}>
                <label>Target Folder</label>
                <input
                  type="text"
                  placeholder="Folder..."
                  className={s.inlineInput}
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                />
              </div>
              <div className={s.settingField}>
                <label>Target Tags</label>
                <input
                  type="text"
                  placeholder="Tags..."
                  className={s.inlineInput}
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                />
              </div>
            </div>

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
                onClick={async () => {
                  if (!importUrl) return
                  setImporting(true)
                  const tags = uploadTags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)

                  try {
                    const res = await fetch("/api/media/fetch-metadata", {
                      method: "POST",
                      body: JSON.stringify({ url: importUrl }),
                    })
                    const metadata = await res.json()
                    if (metadata.error) throw new Error(metadata.error)
                    await mediaService.registerAsset({
                      ...metadata,
                      folder: uploadFolder,
                      tags,
                    })
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
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Import"
                )}
              </Button>
            </div>

            <input
              type="file"
              id="media-upload-page"
              hidden
              multiple
              accept="image/*"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              variant="primary"
              onClick={() =>
                document.getElementById("media-upload-page")?.click()
              }
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Upload size={18} />
              )}
              Upload Assets
            </Button>

            <Button
              variant="secondary"
              onClick={async () => {
                setSyncing(true)
                try {
                  const res = await fetch("/api/media/sync", { method: "POST" })
                  const data = await res.json()
                  alert(data.message || "Sync complete")
                  await fetchAssets()
                } catch (e) {
                  console.error("Sync failed", e)
                } finally {
                  setSyncing(false)
                }
              }}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <svg
                  className="feather-icon"
                  width="18"
                  height="18"
                  style={{ marginRight: "8px" }}
                >
                  <use href="/feather-sprite.svg#refresh-cw" />
                </svg>
              )}
              Sync with Cloudinary
            </Button>
          </div>
        </header>

        <div className={s.content}>
          {loading ? (
            <div className={s.loadingState}>
              <Loader2 className="animate-spin" size={48} />
              <p>Loading library...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className={s.emptyState}>
              <ImageIcon size={64} />
              <h3>No assets found</h3>
              <p>Upload your first asset to get started.</p>
            </div>
          ) : (
            <div className={s.grid}>
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={s.card}
                  onClick={() => setEditingAsset(asset)}
                >
                  <div className={s.preview}>
                    <img src={asset.url} alt={asset.name} />
                  </div>
                  <div className={s.info}>
                    <div className={s.meta}>
                      <span className={s.name}>{asset.name}</span>
                      <span className={s.size}>
                        {asset.width && asset.height
                          ? `${asset.width} × ${asset.height} • `
                          : ""}
                        {(asset.size / 1024).toFixed(1)} KB
                      </span>
                      <span className={s.provider}>
                        {asset.storage_provider}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="small"
                      className={s.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(asset.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MediaDetailsModal
        isOpen={!!editingAsset}
        asset={editingAsset}
        onClose={() => setEditingAsset(null)}
        onUpdate={fetchAssets}
      />
    </main>
  )
}
