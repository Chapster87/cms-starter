import { Metadata } from "next"
import { getModels } from "@/server/models"

interface ModelEditorLayoutProps {
  params: Promise<{
    model: string | undefined
  }>
  children: React.ReactNode
}

/**
 * Dynamic metadata generator for record list pages.
 */
export async function generateMetadata({
  params,
}: ModelEditorLayoutProps): Promise<Metadata> {
  const { model: modelSlug } = await params
  const models = await getModels()
  const modelData = models.find((m) => m.slug === modelSlug)

  return {
    title: modelData ? `${modelData.friendly_name} Records` : "Record List",
  }
}

export default function ModelEditorLayout({
  children,
}: ModelEditorLayoutProps) {
  return children
}
