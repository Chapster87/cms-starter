"use client"

import { useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/utils/supabaseClient"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

/**
 * Renders the main dashboard page, now acting as the homepage.
 * This page will display a welcome message and potentially user information.
 * It will also redirect unauthenticated users to the login page.
 */
export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  if (loading) {
    return <p>Loading homepage...</p> // Updated loading message
  }

  if (!user) {
    return <p>Redirecting to login...</p>
  }

  return (
    <div>
      <h1>Welcome to the Homepage, {user.email}!</h1>{" "}
      {/* Updated welcome message */}
      <p>
        This is your main dashboard. You can navigate to other sections from
        here.
      </p>
      <button
        onClick={async () => {
          await supabase.auth.signOut()
          router.push("/auth")
        }}
      >
        Sign Out
      </button>
      {/* Add links to other dashboard sections, e.g., /dashboard/pages */}
      <p>
        Go to <Link href="/schema">Models Management</Link>{" "}
        {/* Updated link to be relative to root for now */}
      </p>
    </div>
  )
}
