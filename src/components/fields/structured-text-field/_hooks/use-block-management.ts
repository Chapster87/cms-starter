import { useState, useEffect } from "react"
import { Editor } from "@tiptap/react"
import { CMSBlock } from "@/types/fields"

/**
 * Hook to manage block selection and insertion for the Structured Text Editor
 * @param editor Tiptap Editor instance
 * @param allowedBlocks Optional array of allowed block IDs
 * @returns Object containing block management state and handlers
 */
export function useBlockManagement(
  editor: Editor | null,
  allowedBlocks?: string[]
) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [availableBlocks, setAvailableBlocks] = useState<CMSBlock[]>([])

  useEffect(() => {
    /**
     * Fetch all available blocks and filter by allowedBlocks if provided
     */
    async function fetchBlocks() {
      try {
        const response = await fetch("/api/blocks")
        if (!response.ok) throw new Error("Failed to fetch blocks")
        const allBlocks = (await response.json()) as CMSBlock[]

        if (allowedBlocks && allowedBlocks.length > 0) {
          setAvailableBlocks(
            allBlocks.filter((b) => allowedBlocks.includes(b.id))
          )
        } else {
          setAvailableBlocks([])
        }
      } catch (error) {
        console.error("Error fetching blocks:", error)
      }
    }
    fetchBlocks()
  }, [allowedBlocks])

  /**
   * Handle adding a selected block to the editor
   * @param block The CMS block to add
   */
  const handleAddBlock = (block: CMSBlock) => {
    if (!editor) return

    setIsModalOpen(false)

    // Defer insertion to avoid potential state update conflicts during render
    setTimeout(() => {
      editor
        .chain()
        .focus()
        .insertCmsBlock({
          blockId: block.id,
          blockType: block.api_id,
          data: {},
        })
        .run()
    }, 0)
  }

  return {
    isModalOpen,
    setIsModalOpen,
    availableBlocks,
    handleAddBlock,
  }
}
