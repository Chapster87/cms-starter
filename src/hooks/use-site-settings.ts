"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/utils/supabase"
import { toast } from "@/client/toast-store"

export interface SiteSettings {
  defaultPageTitle: string
  titleSuffix: string
  fallbackDescription: string
  noIndex: boolean
  siteUrl: string
  favicon: string | null
}

/**
 * Hook for managing global site settings.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("globals")
      .select("value")
      .eq("key", "site_settings")
      .single()

    if (error) {
      setError(error.message)
      toast.error("Error fetching site settings", error.message)
    } else {
      setSettings(data?.value as SiteSettings)
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
    async (updates: Partial<SiteSettings>) => {
      const supabase = createClient()

      const newSettings = { ...settings, ...updates }

      // Remove social fields if they accidentally exist in the payload
      const cleanedSettings = {
        defaultPageTitle: newSettings.defaultPageTitle,
        titleSuffix: newSettings.titleSuffix,
        fallbackDescription: newSettings.fallbackDescription,
        noIndex: newSettings.noIndex,
        siteUrl: newSettings.siteUrl,
        favicon: newSettings.favicon,
      }

      const { error } = await supabase
        .from("globals")
        .update({
          value: cleanedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("key", "site_settings")

      if (error) {
        toast.error("Error updating site settings", error.message)
        return false
      }

      toast.success(
        "Settings updated",
        "Site settings have been successfully updated."
      )
      setSettings(newSettings as SiteSettings)
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
