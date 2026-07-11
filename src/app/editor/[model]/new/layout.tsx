import { Metadata } from "next"
import { getModels } from "@/server/models"

interface NewRecordLayoutProps {
  params: Promise<{
    model: string | undefined
  }>
  children: React.ReactNode
}

/**
 * Dynamic metadata generator for new record pages.
 */
export async function generateMetadata({
  params,
}: NewRecordLayoutProps): Promise<Metadata> {
  const { model: modelSlug } = await params
  const models = await getModels()
  const modelData = models.find((m) => m.slug === modelSlug)

  return {
    title: modelData ? `New ${modelData.friendly_name}` : "New Record",
  }
}

export default function NewRecordLayout({ children }: NewRecordLayoutProps) {
  return children
}
