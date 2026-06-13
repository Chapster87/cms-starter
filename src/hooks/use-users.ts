"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/utils/supabase"
import { toast } from "@/client/toast-store"

export interface UserRecord {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  role: string
  status: string
  created_at: string
}

/**
 * Hook for managing CMS users.
 */
export function useUsers() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      toast.error("Error fetching users", error.message)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  const updateUser = useCallback(
    async (
      id: string,
      updates: Partial<Omit<UserRecord, "id" | "created_at" | "email">>
    ) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)

      if (error) {
        toast.error("Error updating user", error.message)
        return false
      }

      toast.success(
        "User updated",
        "User record has been successfully updated."
      )
      await fetchUsers()
      return true
    },
    [fetchUsers]
  )

  const deleteUser = useCallback(
    async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) {
        toast.error("Error deleting user", error.message)
        return false
      }

      toast.success(
        "User deleted",
        "User record has been successfully removed."
      )
      await fetchUsers()
      return true
    },
    [fetchUsers]
  )

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
    updateUser,
    deleteUser,
  }
}
