"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { gql } from "graphql-request"
import { Page } from "@customTypes/page"
import PageForm from "../_components/page-form" // Relative import
import { getGraphqlClient } from "@client/graphqlClient"

// GraphQL mutation to create a new page
const CREATE_PAGE_MUTATION = gql`
  mutation CreatePage($title: String!, $slug: String!, $content: String) {
    insertIntopagesCollection(
      objects: { title: $title, slug: $slug, content: $content }
    ) {
      records {
        id
        title
        slug
      }
    }
  }
`

interface CreatePageMutationResponse {
  insertIntopagesCollection: {
    records: {
      id: string
      title: string
      slug: string
    }[]
  }
}

/**
 * Renders the page for creating a new page.
 */
export default function CreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSavePage = useCallback(
    async (pageData: Omit<Page, "id" | "created_at" | "updated_at">) => {
      setLoading(true)
      setError(null)
      try {
        const client = await getGraphqlClient()
        await client.request<CreatePageMutationResponse>(
          CREATE_PAGE_MUTATION,
          pageData
        )
        router.push("/pages") // Redirect to page list after creation
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create page."
        setError(errorMessage)
        console.error("Error creating page:", err)
      } finally {
        setLoading(false)
      }
    },
    [router]
  )

  const handleCancel = useCallback(() => {
    router.push("/pages") // Redirect to page list on cancel
  }, [router])

  if (loading) return <p>Creating page...</p>
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>

  return (
    <div>
      <h1>Create New Page</h1>
      <PageForm onSubmit={handleSavePage} onCancel={handleCancel} />
    </div>
  )
}
