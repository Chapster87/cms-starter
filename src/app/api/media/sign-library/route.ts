import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * API route to generate a signature for the Cloudinary Media Library widget.
 * Uses the API_SECRET to sign the request.
 */
export async function POST() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000)

    // For Media Library Widget, we sign the timestamp
    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
    })
  } catch (error) {
    console.error("Library signature error:", error)
    return NextResponse.json(
      { error: "Failed to generate library signature" },
      { status: 500 }
    )
  }
}
