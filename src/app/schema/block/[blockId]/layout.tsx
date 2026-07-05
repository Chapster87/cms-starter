import { Metadata } from "next"
import { getBlocks } from "@/server/blocks"
import { CMSBlock } from "@/types/fields"

interface BlockLayoutProps {
  params: Promise<{
    blockId: string | undefined
  }>
  children: React.ReactNode
}

/**
 * Dynamic metadata generator for block schema pages.
 */
export async function generateMetadata({
  params,
}: BlockLayoutProps): Promise<Metadata> {
  const { blockId } = await params
  const blocks = await getBlocks()
  const blockData = blocks.find((b: CMSBlock) => b.id === blockId)

  return {
    title: blockData ? `Block: ${blockData.label}` : "Block Schema",
  }
}

export default function BlockLayout({ children }: BlockLayoutProps) {
  return children
}
