import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import Card from "@/components/card"
import { createClient } from "@/utils/supabase-server"

export const metadata: Metadata = {
  title: "Dashboard",
}

/**
 * Renders the main dashboard page.
 * Handles authentication and metadata on the server.
 */
export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  return (
    <div>
      <Card>
        <h1>Welcome to the Homepage, {user.email}!</h1>
        <p>
          This is your main dashboard. You can navigate to other sections from
          here.
        </p>
        <p>
          Go to <Link href="/schema">Models Management</Link>
        </p>
      </Card>
    </div>
  )
}
