"use client"

import React, { useCallback, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { gql } from "graphql-request"
import { Page } from "@customTypes/page"
import PageForm from "../../_components/page-form" // Relative import
import { getGraphqlClient } from "@client/graphqlClient"

// GraphQL query to fetch a single page by ID
const GET_PAGE_BY_ID_QUERY = gql`
  query GetPageById($id: UUID!) {
    pagesCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          id
          title
          slug
          content
          created_at
          updated_at
        }
      }
    }
  }
`

// GraphQL mutation to update an existing page
const UPDATE_PAGE_MUTATION = gql`
  mutation UpdatePage(
    $id: UUID!
    $title: String!
    $slug: String!
    $content: String
  ) {
    updatepagesCollection(
      set: { title: $title, slug: $slug, content: $content }
      filter: { id: { eq: $id } }
    ) {
      records {
        id
        title
        slug
      }
    }
  }
`

interface GetPageByIdQueryResponse {
  pagesCollection: {
    edges: {
      node: Page
    }[]
  }
}

interface UpdatePageMutationResponse {
  updatepagesCollection: {
    records: {
      id: string
      title: string
      slug: string
    }[]
  }
}

interface EditPageProps {
  // Type params as a Promise that resolves to { id: string }
  // This aligns with Next.js's behavior and React.use()
  params: Promise<{ id: string }> | { id: string }
}

/**
 * Renders the page for editing an existing page.
 */
export default function EditPage({ params }: EditPageProps) {
  const router = useRouter()
  // Use React.use to unwrap the params Promise, as suggested by Next.js and type it correctly
  const { id } = React.use(params as Promise<{ id: string }>) // Assert params as a Promise

  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPage() {
      if (!id) {
        setError("Page ID is missing or invalid in URL.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const client = await getGraphqlClient()
        const data = await client.request<GetPageByIdQueryResponse>(
          GET_PAGE_BY_ID_QUERY,
          { id }
        )
        if (data.pagesCollection.edges.length > 0) {
          setPage(data.pagesCollection.edges[0].node)
        } else {
          setError("Page not found.")
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch page."
        setError(errorMessage)
        console.error("Error fetching page:", err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPage()
    }
  }, [id]) // Removed getGraphqlClient from dependency array

  const handleSavePage = useCallback(
    async (pageData: Omit<Page, "id" | "created_at" | "updated_at">) => {
      if (!id) {
        setError("Page ID is missing for update.")
        return
      }

      setLoading(true)
      setError(null)
      try {
        const client = await getGraphqlClient()
        await client.request<UpdatePageMutationResponse>(UPDATE_PAGE_MUTATION, {
          id: id,
          ...pageData,
        })
        router.push("/pages") // Redirect to page list after update
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update page."
        setError(errorMessage)
        console.error("Error updating page:", err)
      } finally {
        setLoading(false)
      }
    },
    [id, router] // Removed getGraphqlClient from dependency array
  )

  const handleCancel = useCallback(() => {
    router.push("/pages")
  }, [router])

  if (loading) return <p>Loading page...</p>
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>
  if (!page) return <p>Page data not available.</p>

  return (
    <div>
      <h1>Edit Page</h1>
      <PageForm
        initialData={page}
        onSubmit={handleSavePage}
        onCancel={handleCancel}
      />
    </div>
  )
}
