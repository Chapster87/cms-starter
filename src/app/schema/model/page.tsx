import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import Button from "@/components/button"
import { getModels } from "@/server/models"

export const metadata: Metadata = {
  title: "Model Management",
}

export default async function ModelsRedirectPage() {
  const models = await getModels()

  if (models.length > 0) {
    redirect(`/schema/model/${models[0].slug}`)
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>No Models Found</h1>
      <p style={{ color: "var(--color-grey-500)", marginBottom: "24px" }}>
        Get started by creating your first content model.
      </p>
      <Link href="/schema?action=new-model">
        <Button>Create New Model</Button>
      </Link>
    </div>
  )
}
