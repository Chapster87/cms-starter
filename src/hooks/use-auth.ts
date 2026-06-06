"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase"

/**
 * Custom hook to manage Supabase authentication state.
 * Provides the current user, access token, and loading state.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    /**
     * Fetches the initial session and user data.
     */
    async function getInitialSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user || null)
        setAccessToken(session?.access_token || null)
      } catch (error) {
        console.error("Error fetching initial session:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
        setAccessToken(session?.access_token || null)
        setLoading(false)
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  return { user, accessToken, loading }
}
