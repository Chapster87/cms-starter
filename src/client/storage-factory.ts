import { StorageProvider } from "@/types/cms-generated"
import { StorageAdapter } from "./media-service"
import { cloudinaryAdapter } from "./storage-adapters/cloudinary-adapter"

/**
 * Factory for retrieving the active storage adapter based on configuration.
 */
export const storageFactory = {
  getAdapter(provider: StorageProvider = "cloudinary"): StorageAdapter {
    switch (provider) {
      case "cloudinary":
        return cloudinaryAdapter
      default:
        throw new Error(`Storage provider '${provider}' not supported.`)
    }
  },

  getActiveProvider(): StorageProvider {
    // This could be driven by an environment variable in the future
    return "cloudinary"
  },
}
