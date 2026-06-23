import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { createClient } from "@supabase/supabase-js"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API route to sync the local registry with Cloudinary.
 * It checks if assets in the local registry still exist in Cloudinary.
 */
export async function POST() {
  try {
    // 1. Fetch all assets from local registry
    const { data: localAssets, error: fetchError } = await supabase
      .from("media_assets")
      .select("id, provider_metadata, storage_provider")
      .eq("storage_provider", "cloudinary")

    if (fetchError) throw fetchError
    if (!localAssets || localAssets.length === 0) {
      return NextResponse.json({
        message: "No assets to sync",
        deletedCount: 0,
      })
    }

    const deletedIds: string[] = []

    // 2. Verify existence in Cloudinary (batch in groups of 100 or sequential for simplicity here)
    // Cloudinary Admin API has rate limits, so for very large libraries we'd need a different approach.
    for (const asset of localAssets) {
      const metadata = asset.provider_metadata as { public_id?: string }
      const publicId = metadata?.public_id
      if (!publicId) continue

      try {
        await cloudinary.api.resource(publicId)
      } catch (err: unknown) {
        const error = err as { error?: { http_code?: number } }
        if (error.error?.http_code === 404) {
          // Asset missing in Cloudinary
          deletedIds.push(asset.id)
        }
      }
    }

    // 3. Remove missing assets from Supabase
    if (deletedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("media_assets")
        .delete()
        .in("id", deletedIds)

      if (deleteError) throw deleteError
    }

    // 4. Also clean up any duplicates that might have slipped in (sanity check)
    const { data: duplicates } = await supabase.rpc("exec_sql", {
      sql: `
        WITH duplicates AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY storage_provider, (provider_metadata->>'public_id') 
              ORDER BY created_at DESC
            ) as row_num
          FROM public.media_assets
          WHERE storage_provider = 'cloudinary'
            AND provider_metadata->>'public_id' IS NOT NULL
        )
        SELECT id FROM duplicates WHERE row_num > 1;
      `,
    })

    let duplicateCount = 0
    if (duplicates && duplicates.length > 0) {
      duplicateCount = duplicates.length
      const duplicateIds = duplicates.map((d: { id: string }) => d.id)
      await supabase.from("media_assets").delete().in("id", duplicateIds)
    }

    return NextResponse.json({
      message: `Sync complete. Removed ${deletedIds.length} broken references and ${duplicateCount} duplicates.`,
      deletedCount: deletedIds.length + duplicateCount,
      deletedIds,
    })
  } catch (err: unknown) {
    const error = err as Error
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Sync failed", details: error.message },
      { status: 500 }
    )
  }
}
