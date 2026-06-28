import { Metadata } from "next"
import { getModels } from "@/server/models"

interface Props {
  params: Promise<{ model: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { model: modelSlug } = await params
  const models = await getModels()
  const modelData = models.find((m) => m.slug === modelSlug)

  return {
    title: modelData ? modelData.friendly_name : "Content Editor",
  }
}

export default function ModelEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
