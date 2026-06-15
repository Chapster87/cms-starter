import { MediaAsset, StorageAdapter } from "@/types/media"

/**
 * Cloudinary Storage Adapter for secure client-side uploads using signed signatures.
 */
export const cloudinaryAdapter: StorageAdapter = {
  async upload(
    file: File,
    options?: { folder?: string; tags?: string[] }
  ): Promise<Partial<MediaAsset>> {
    // 1. Get signature from our API
    const params = {
      folder: options?.folder || "uploads",
      tags: options?.tags?.join(",") || "",
    }

    const signResponse = await fetch("/api/media/sign", {
      method: "POST",
      body: JSON.stringify({ params }),
    })

    const { signature, timestamp, cloud_name, api_key } =
      await signResponse.json()

    // 2. Upload to Cloudinary
    const formData = new FormData()
    formData.append("file", file)
    formData.append("signature", signature)
    formData.append("timestamp", timestamp.toString())
    formData.append("api_key", api_key)
    formData.append("folder", params.folder)
    formData.append("tags", params.tags)

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      throw new Error(errorData.error?.message || "Cloudinary upload failed")
    }

    const data = await uploadResponse.json()

    // 3. Map Cloudinary response to our MediaAsset schema
    return {
      name: file.name,
      file_name: file.name,
      url: data.secure_url,
      type: `${data.resource_type}/${data.format}`,
      size: data.bytes,
      width: data.width,
      height: data.height,
      storage_provider: "cloudinary",
      folder: params.folder,
      tags: options?.tags || [],
      provider_metadata: {
        public_id: data.public_id,
        version: data.version,
        signature: data.signature,
      },
    }
  },

  async delete(asset: MediaAsset): Promise<void> {
    // Note: Deleting from Cloudinary usually requires an admin API call (server-side)
    // For now, we'll implement the registry deletion and leave provider deletion for a server-side helper if needed
    console.warn("Provider-side deletion not yet implemented for Cloudinary")
  },

  async getSignedUrl(asset: MediaAsset): Promise<string> {
    return asset.url
  },
}
