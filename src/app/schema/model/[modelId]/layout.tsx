import { Metadata } from "next"
import { getModels } from "@/server/models"

interface ModelLayoutProps {
  params: Promise<{
    modelId: string | undefined
  }>
  children: React.ReactNode
}

/**
 * Dynamic metadata generator for model schema pages.
 */
export async function generateMetadata({
  params,
}: ModelLayoutProps): Promise<Metadata> {
  const { modelId: modelSlug } = await params
  const models = await getModels()
  const modelData = models.find(
    (m) => m.slug === modelSlug || m.table_name === modelSlug
  )

  return {
    title: modelData ? `Model: ${modelData.friendly_name}` : "Model Schema",
  }
}

export default function ModelLayout({ children }: ModelLayoutProps) {
  return children
}
