"use client"

import { useState } from "react"
import AuthForm from "./_components/auth-form"

/**
 * Renders the authentication page.
 * This page allows users to sign in or sign up.
 */
export default function AuthPage() {
  const [loading, _setLoading] = useState(false)
  const [error, _setError] = useState<string | null>(null)

  // @TODO: Implement email/password login, if desired, in AuthForm
  // For now, focus on Google OAuth

  return (
    <div>
      <h1>Sign In</h1>
      <AuthForm />
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  )
}
