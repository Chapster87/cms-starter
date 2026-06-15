# Media Library Setup & Usage Guide

The Media Library is a storage-agnostic asset management system. It uses a **local registry** (Supabase) to track asset metadata while storing physical files in external providers like **Cloudinary**.

## Configuration

To enable Cloudinary integration, add the following to your `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How it Works

1.  **Registry-First Approach**: The CMS only shows assets that are registered in the `public.media_assets` table in Supabase.
2.  **Upload Flow**: When you upload a file, it is sent securely to Cloudinary. Once successful, the CMS saves the URL and metadata (width, height, size) into the Supabase registry.
3.  **Agnosticism**: The UI interacts with a `StorageAdapter` interface. Switching to Supabase Storage or AWS S3 only requires creating a new adapter; the UI and database schema remain the same.

## Frequently Asked Questions

### Will existing images in my Cloudinary account show up automatically?

**No.** By design, the library only shows assets uploaded via the CMS.

- **Why?** This ensures that every asset has a local record for metadata management (alt text, tags, folders) and allows the GraphQL CDA to resolve assets quickly without calling external APIs.
- **Migration**: If you have existing assets you want to see in the CMS, you can "import" them by adding a row to the `media_assets` table with the asset's Cloudinary URL and metadata.

### How do I use the Media Gallery?

- **Standalone**: Click "Media Library" in the main sidebar to browse, upload, or delete assets globally.
- **In-Field**: When editing a record, click the "Media Assets" field to open the browser. You can select existing assets or upload new ones on the fly.

## Technical Architecture

- **Database**: `public.media_assets` (Supabase)
- **API**: `/api/media/sign` (Next.js) - Handles secure signature generation.
- **Client Service**: `src/client/media-service.ts` - Manages the registry.
- **Storage Factory**: `src/client/storage-factory.ts` - Determines which provider to use.
