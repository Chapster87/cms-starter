import { Metadata } from "next"
import { getModels } from "@/server/models"
import { getRecordById } from "@/server/records"
import { getRecordDisplayName } from "@/helpers/record-helpers"

interface Props {
  params: Promise<{ model: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { model: modelSlug, id } = await params
  const [models, record] = await Promise.all([
    getModels(),
    getRecordById(modelSlug, id, { resolve: true }),
  ])

  const modelData = models.find((m) => m.slug === modelSlug)

  if (id === "new") {
    return {
      title: `New ${modelData?.friendly_name || "Record"}`,
    }
  }

  const displayName = getRecordDisplayName(
    record,
    modelData?.friendly_name,
    modelData?.is_singleton,
    modelData?.list_columns
  )

  const title = modelData?.is_singleton ? displayName : `Edit ${displayName}`

  return {
    title,
    openGraph: {
      title: `${title} | Forge CMS`,
    },
  }
}

export default function RecordEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
