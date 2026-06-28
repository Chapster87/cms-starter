import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import Button from "@/components/button"
import { getModels } from "@/server/models"

export const metadata: Metadata = {
  title: "Schema Management",
}

/**
 * Renders the models management dashboard.
 * If models exist, redirects to the first model's schema page on the server.
 * Otherwise, displays a message and an option to create a new model.
 */
export default async function ModelsDashboard() {
  const models = await getModels()

  if (models.length > 0) {
    redirect(`/schema/${models[0].slug}`)
  }

  return (
    <div>
      <h1>Models Management</h1>
      <p>Here you can manage your database models (tables).</p>
      {models.length === 0 && (
        <div>
          <p>No models found. Get started by creating your first one.</p>
          <Link href="/schema/new">
            <Button>Create New Model</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
