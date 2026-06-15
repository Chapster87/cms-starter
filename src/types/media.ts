export type StorageProvider = "cloudinary" | "supabase" | "local"

export interface MediaAsset {
  id: string
  created_at: string
  updated_at: string
  name: string
  file_name?: string
  url: string
  type: string
  size: number
  width?: number
  height?: number
  alt_text?: string
  folder: string
  tags: string[]
  storage_provider: StorageProvider
  provider_metadata: Record<string, unknown>
  created_by?: string
}

export interface StorageAdapter {
  upload(
    file: File,
    options?: { folder?: string; tags?: string[] }
  ): Promise<Partial<MediaAsset>>
  delete(asset: MediaAsset): Promise<void>
  getSignedUrl(asset: MediaAsset): Promise<string>
}
