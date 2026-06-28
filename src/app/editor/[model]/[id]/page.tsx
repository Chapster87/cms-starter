import { getModels } from "@/server/models"
import { getRecordById } from "@/server/records"
import { getRecordDisplayName } from "@/helpers/record-helpers"
import EditRecordClient from "./_components/edit-record-client"

interface EditRecordPageProps {
  params: Promise<{
    model: string | undefined
    id: string | undefined
  }>
}

/**
 * Server-side Page for editing a record.
 * Fetches the resolved record on the server and passes it to the client.
 */
export default async function EditRecordPage({ params }: EditRecordPageProps) {
  const { model: modelSlug, id } = await params

  if (!modelSlug || !id) {
    return <p>Invalid parameters.</p>
  }

  // Fetch data on the server
  const [models, record] = await Promise.all([
    getModels(),
    getRecordById(modelSlug, id, { resolve: true }),
  ])

  const modelData = models.find((m) => m.slug === modelSlug)

  if (!record) {
    return <p>Record not found.</p>
  }

  const displayName = getRecordDisplayName(
    record,
    modelData?.friendly_name,
    modelData?.is_singleton,
    modelData?.list_columns
  )

  return (
    <EditRecordClient
      modelSlug={modelSlug}
      id={id}
      initialRecord={record}
      modelData={modelData}
      displayName={displayName}
    />
  )
}
