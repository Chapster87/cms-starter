"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/utils/supabase"
import { toast } from "@/client/toast-store"

export interface SocialSettings {
  socialSiteName: string
  twitterHandle: string
  twitterUrl: string
  facebookUrl: string
  instagramUrl: string
  linkedinUrl: string
  youtubeUrl: string
  tiktokUrl: string
  socialCard: string | null
  ogType: string
  ogLocale: string
  twitterCardType: "summary" | "summary_large_image"
}

/**
 * Hook for managing global social media settings.
 */
export function useSocialSettings() {
  const [settings, setSettings] = useState<SocialSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("globals")
      .select("value")
      .eq("key", "social_settings")
      .maybeSingle()

    if (error) {
      setError(error.message)
      toast.error("Error fetching social settings", error.message)
    } else if (data) {
      setSettings(data.value as SocialSettings)
    } else {
      // Initialize if doesn't exist
      setSettings({
        socialSiteName: "",
        twitterHandle: "",
        twitterUrl: "",
        facebookUrl: "",
        instagramUrl: "",
        linkedinUrl: "",
        youtubeUrl: "",
        tiktokUrl: "",
        socialCard: null,
        ogType: "website",
        ogLocale: "en_US",
        twitterCardType: "summary_large_image",
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSettings()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchSettings])

  const updateSettings = useCallback(
    async (updates: Partial<SocialSettings>) => {
      const supabase = createClient()

      const newSettings = { ...settings, ...updates }

      const { error } = await supabase.from("globals").upsert(
        {
          key: "social_settings",
          value: newSettings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )

      if (error) {
        toast.error("Error updating social settings", error.message)
        return false
      }

      toast.success(
        "Social settings updated",
        "Social media settings have been successfully updated."
      )
      setSettings(newSettings as SocialSettings)
      return true
    },
    [settings]
  )

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
    updateSettings,
  }
}
