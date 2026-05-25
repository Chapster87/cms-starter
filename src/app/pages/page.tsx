"use client"

import { useState, useEffect, useCallback } from "react"
import { gql } from "graphql-request" // Keep gql import for query definition
import { useRouter } from "next/navigation" // Import useRouter for navigation
import Link from "next/link" // Import Link component for navigation
import { Page } from "@customTypes/page"
import PageList from "./_components/page-list"
import { getGraphqlClient } from "@client/graphqlClient"

// Define GraphQL response type for GetPages
interface GetPagesQueryResponse {
  pagesCollection: {
    edges: {
      node: Page
    }[]
  }
}

// GraphQL query to fetch all pages
const GET_PAGES_QUERY = gql`
  query GetPages {
    pagesCollection {
      edges {
        node {
          id
          title
          slug
          created_at
          updated_at
          content
        }
      }
    }
  }
`

interface DeletePageMutationResponse {
  deleteFrompagesCollection: {
    records: {
      id: string
    }[]
  }
}

/**
 * Renders the page list overview.
 * This page will display a list of all pages and provide options to create/edit/delete them.
 */
export default function PagesDashboard() {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // New state to trigger refresh

  const fetchPages = useCallback(async (): Promise<Page[]> => {
    try {
      const client = await getGraphqlClient() // Get authenticated client
      const data = await client.request<GetPagesQueryResponse>(GET_PAGES_QUERY)
      return data.pagesCollection.edges.map((edge: { node: Page }) => edge.node)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch pages."
      console.error("Error fetching pages:", err)
      throw new Error(errorMessage)
    }
  }, [])

  useEffect(() => {
    const loadPages = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedPages = await fetchPages()
        setPages(fetchedPages)
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load pages."
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    loadPages()
  }, [fetchPages, refreshTrigger]) // Added refreshTrigger as a dependency

  /**
   * Handles deleting a page.
   * @param {string} id - The ID of the page to delete.
   */
  const handleDeletePage = useCallback(async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this page?")) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const client = await getGraphqlClient() // Get authenticated client
      await client.request<DeletePageMutationResponse>(
        gql`
          mutation DeletePage($id: UUID!) {
            deleteFrompagesCollection(filter: { id: { eq: $id } }) {
              records {
                id
              }
            }
          }
        `, // Moved DELETE_PAGE_MUTATION inline for simplicity
        { id }
      )
      setRefreshTrigger((prev) => prev + 1) // Increment trigger to force refresh
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete page."
      setError(errorMessage)
      console.error("Error deleting page:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleEditPage = useCallback(
    (page: Page) => {
      router.push(`/pages/${page.id}/edit`) // Redirect to dynamic edit page
    },
    [router]
  )

  if (loading) return <p>Loading pages...</p>
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>

  return (
    <div>
      <h1>Pages Management</h1>
      <p>Here you can manage your content pages.</p>
      <Link href="/pages/new">
        <button>Create New Page</button>
      </Link>
      <PageList
        pages={pages}
        onEdit={handleEditPage}
        onDelete={handleDeletePage}
      />
    </div>
  )
}
