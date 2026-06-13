"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/utils/supabase"
import { toast } from "@/client/toast-store"

export interface AuthorRecord {
  id: string
  name: string
  avatar_url?: string
  user_id?: string
  status: string
  created_at: string
  updated_at: string
}

/**
 * Hook for managing Author records.
 */
export function useAuthors() {
  const [authors, setAuthors] = useState<AuthorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAuthors = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("authors")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      setError(error.message)
      toast.error("Error fetching authors", error.message)
    } else {
      setAuthors(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuthors()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchAuthors])

  const updateAuthor = useCallback(
    async (
      id: string,
      updates: Partial<Omit<AuthorRecord, "id" | "created_at">>
    ) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("authors")
        .update(updates)
        .eq("id", id)

      if (error) {
        toast.error("Error updating author", error.message)
        return false
      }

      toast.success(
        "Author updated",
        "Author record has been successfully updated."
      )
      await fetchAuthors()
      return true
    },
    [fetchAuthors]
  )

  return {
    authors,
    loading,
    error,
    refresh: fetchAuthors,
    updateAuthor,
  }
}
