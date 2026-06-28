import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getModels } from "@/server/models"
import s from "./style.module.css"

export const metadata: Metadata = {
  title: "Content Editor",
}

/**
 * Renders the Editor landing page.
 * Redirects to the first model in the list on the server.
 */
export default async function EditorLandingPage() {
  const models = await getModels()

  if (models.length > 0) {
    redirect(`/editor/${models[0].slug}`)
  }

  return (
    <div className={s.placeholder}>
      <h1>Content Editor</h1>
      <p>Select a model from the sidebar to manage its records.</p>
      {models.length === 0 && (
        <p>No models found. Create one in the Schema section first.</p>
      )}
    </div>
  )
}
