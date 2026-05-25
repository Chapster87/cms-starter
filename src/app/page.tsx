"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabaseClient"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js" // Import User type

/**
 * Renders the main dashboard page, now acting as the homepage.
 * This page will display a welcome message and potentially user information.
 * It will also redirect unauthenticated users to the login page.
 */
export default function Home() {
  // Changed component name from Dashboard to Home
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth") // Redirect to auth page if not logged in
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    getUser()

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          router.push("/auth")
        } else if (session) {
          setUser(session.user)
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe() // Corrected unsubscribe call
    }
  }, [router])

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
        Go to <a href="/pages">Pages Management</a>{" "}
        {/* Updated link to be relative to root for now */}
      </p>
    </div>
  )
}
