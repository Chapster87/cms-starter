"use client"

import { useCallback, useState } from "react"
import { supabase } from "@/utils/supabaseClient"
import s from "./style.module.css"

/**
 * Renders the authentication form with Google OAuth.
 */
export default function AuthForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handles sign in with Google.
   */
  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Supabase will redirect here after sign-in
        },
      })

      if (error) throw error
      // No explicit success handling here, as Supabase will redirect
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign in with Google."
      setError(errorMessage)
      console.error("Error signing in with Google:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className={s.authFormContainer}>
      {/* Google Sign-In Button */}
      <button
        className={s.googleButton}
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>

      {error && <p className={s.errorText}>{error}</p>}

      {/* @TODO: Add email/password form fields here using Radix UI if desired */}
      {/* Example of Radix Label (Note: Radix doesn't have a direct Input component) */}
      {/* <div className={s.formGroup}>
        <Label.Root className={s.label} htmlFor="email">
          Email
        </Label.Root>
        <input
          className={s.input}
          type="email"
          id="email"
          name="email"
          required
        />
      </div> */}
    </div>
  )
}
