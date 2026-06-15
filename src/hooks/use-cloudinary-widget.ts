"use client"

import { useCallback } from "react"
import { mediaService } from "@/client/media-service"

interface CloudinaryAsset {
  public_id: string
  secure_url: string
  resource_type: string
  format: string
  bytes: number
  width: number
  height: number
  version: number
}

interface CloudinaryWidgetOptions {
  cloud_name: string
  api_key: string
  timestamp: number
  signature: string
  multiple?: boolean
  insert_caption?: string
}

interface CloudinaryWidgetHandlers {
  insertHandler: (data: { assets: CloudinaryAsset[] }) => Promise<void>
}

interface CloudinaryGlobal {
  openMediaLibrary: (
    options: CloudinaryWidgetOptions,
    handlers: CloudinaryWidgetHandlers
  ) => void
}

/**
 * Hook to manage the Cloudinary Media Library widget.
 */
export function useCloudinaryWidget(onSuccess?: () => void) {
  const launchWidget = useCallback(
    (
      signature: string,
      timestamp: number,
      cloudName: string,
      apiKey: string
    ) => {
      const cloudinary = (window as unknown as { cloudinary: CloudinaryGlobal })
        .cloudinary
      if (cloudinary) {
        cloudinary.openMediaLibrary(
          {
            cloud_name: cloudName,
            api_key: apiKey,
            timestamp: timestamp,
            signature: signature,
            multiple: true,
            insert_caption: "Insert into CMS",
          },
          {
            insertHandler: async (data: { assets: CloudinaryAsset[] }) => {
              const assets = data.assets || []
              const promises = assets.map(async (asset) => {
                return mediaService.registerAsset({
                  name: asset.public_id.split("/").pop(),
                  file_name: asset.public_id,
                  url: asset.secure_url,
                  type: `${asset.resource_type}/${asset.format}`,
                  size: asset.bytes,
                  width: asset.width,
                  height: asset.height,
                  storage_provider: "cloudinary",
                  provider_metadata: {
                    public_id: asset.public_id,
                    version: asset.version,
                  },
                })
              })

              await Promise.all(promises)
              if (onSuccess) onSuccess()
            },
          }
        )
      }
    },
    [onSuccess]
  )

  const openWidget = useCallback(async () => {
    // 1. Get Signature
    const res = await fetch("/api/media/sign-library", { method: "POST" })
    const { signature, timestamp, cloud_name, api_key } = await res.json()

    // 2. Initialize Widget (ensure script is loaded)
    if (!(window as unknown as { cloudinary: unknown }).cloudinary) {
      const script = document.createElement("script")
      script.src = "https://media-library.cloudinary.com/global/all.js"
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        launchWidget(signature, timestamp, cloud_name, api_key)
      }
    } else {
      launchWidget(signature, timestamp, cloud_name, api_key)
    }
  }, [launchWidget])

  return { openWidget }
}
