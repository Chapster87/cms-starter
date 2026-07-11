"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/button"
import { createClient } from "@/utils/supabase"
import s from "./style.module.css"

/**
 * Renders the authentication form with Google OAuth and Email/Password.
 */
export default function AuthForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  /**
   * Handles sign in with Email and Password.
   */
  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)
      const supabase = createClient()

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        router.push("/")
        router.refresh()
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to sign in."
        setError(errorMessage)
        console.error("Error signing in:", err)
      } finally {
        setLoading(false)
      }
    },
    [email, password, router]
  )

  /**
   * Handles sign in with Google.
   */
  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithOAuth({
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
      <form onSubmit={handleEmailSignIn} className={s.emailForm}>
        <div className={s.formGroup}>
          <label className={s.label} htmlFor="email">
            Email Address
          </label>
          <input
            className={s.input}
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>

        <div className={s.formGroup}>
          <label className={s.label} htmlFor="password">
            Password
          </label>
          <input
            className={s.input}
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" isLoading={loading} disabled={loading}>
          Sign In
        </Button>
      </form>

      <div className={s.divider}>
        <span className={s.dividerLine}></span>
        <span className={s.dividerText}>or</span>
        <span className={s.dividerLine}></span>
      </div>

      {/* Google Sign-In Button */}
      <Button
        type="button"
        variant="secondary"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Sign in with Google
      </Button>

      {error && <p className={s.errorText}>{error}</p>}
    </div>
  )
}
