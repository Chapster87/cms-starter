import { Metadata } from "next"
import { getModels } from "@/server/models"
import { getRecordById } from "@/server/records"
import { getRecordDisplayName } from "@/helpers/record-helpers"

interface EditRecordLayoutProps {
  params: Promise<{
    model: string | undefined
    id: string | undefined
  }>
  children: React.ReactNode
}

/**
 * Dynamic metadata generator for record editing pages.
 */
export async function generateMetadata({
  params,
}: EditRecordLayoutProps): Promise<Metadata> {
  const { model: modelSlug, id } = await params

  if (!modelSlug || !id) return { title: "Edit Record" }

  const [models, record] = await Promise.all([
    getModels(),
    getRecordById(modelSlug, id, { resolve: true }),
  ])

  if (!record) return { title: "Record Not Found" }

  const modelData = models.find((m) => m.slug === modelSlug)
  const displayName = getRecordDisplayName(
    record,
    modelData?.friendly_name,
    modelData?.is_singleton,
    modelData?.list_columns
  )

  return {
    title: modelData?.is_singleton
      ? `Edit ${modelData.friendly_name}`
      : `Edit ${displayName}`,
  }
}

export default function EditRecordLayout({ children }: EditRecordLayoutProps) {
  return children
}
