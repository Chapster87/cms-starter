import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * API route to fetch metadata for an existing Cloudinary asset by its URL.
 * Useful for importing existing assets into the CMS registry.
 */
export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Extract public_id from URL
    // e.g., https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/image.jpg
    const parts = url.split("/")
    const uploadIndex = parts.indexOf("upload")
    if (uploadIndex === -1) {
      return NextResponse.json(
        { error: "Invalid Cloudinary URL" },
        { status: 400 }
      )
    }

    // public_id is everything after the version (v1234567) or 'upload'
    // but before the file extension
    let publicIdWithExt = parts.slice(uploadIndex + 1).join("/")
    // strip version if present (starts with 'v')
    if (
      parts[uploadIndex + 1].startsWith("v") &&
      !isNaN(parseInt(parts[uploadIndex + 1].slice(1)))
    ) {
      publicIdWithExt = parts.slice(uploadIndex + 2).join("/")
    }

    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "")

    // Fetch resource from Cloudinary Admin API
    const resource = await cloudinary.api.resource(publicId)

    return NextResponse.json({
      name: publicId.split("/").pop(),
      file_name: publicIdWithExt,
      url: resource.secure_url,
      type: `${resource.resource_type}/${resource.format}`,
      size: resource.bytes,
      width: resource.width,
      height: resource.height,
      storage_provider: "cloudinary",
      provider_metadata: {
        public_id: resource.public_id,
        version: resource.version,
      },
    })
  } catch (error) {
    console.error("Fetch metadata error:", error)
    return NextResponse.json(
      { error: "Failed to fetch asset metadata from Cloudinary" },
      { status: 500 }
    )
  }
}
