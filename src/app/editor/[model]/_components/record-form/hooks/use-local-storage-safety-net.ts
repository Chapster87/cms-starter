"use client"

import { useState, useEffect, useCallback } from "react"
import { CMSModelName } from "@/types/cms-generated"

interface UseLocalStorageSafetyNetProps {
  id?: string
  model: CMSModelName
  currentValues: Record<string, unknown>
  onRestore: (data: Record<string, unknown>) => void
}

/**
 * Hook for persisting unsaved 'new' record state to Local Storage.
 * Provides a safety net for data loss before a database entry is created.
 */
export function useLocalStorageSafetyNet({
  id,
  model,
  currentValues,
  onRestore,
}: UseLocalStorageSafetyNetProps) {
  const [hasRestorableData, setHasRestorableData] = useState(false)
  const storageKey = `cms_pending_${model}`

  // We only enable the safety net for 'new' records (no id)
  const isEnabled = !id

  // Check for existing data on mount
  useEffect(() => {
    if (!isEnabled) return

    const savedData = localStorage.getItem(storageKey)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        // Only flag if there's actual data (beyond empty object)
        if (Object.keys(parsed).length > 0) {
          // Wrap in a microtask or use a short timeout to avoid synchronous setState warning
          // although in mount-only effects it's usually safe, but let's follow the linter
          const timer = setTimeout(() => {
            setHasRestorableData(true)
          }, 0)
          return () => clearTimeout(timer)
        }
      } catch (e) {
        console.error("Failed to parse local storage data", e)
      }
    }
  }, [isEnabled, storageKey])

  // Save data whenever currentValues changes
  useEffect(() => {
    if (!isEnabled) return

    // If values are empty, we might want to clear, but usually we just skip saving
    if (Object.keys(currentValues).length === 0) {
      return
    }

    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(currentValues))
    }, 1000) // Debounce save to local storage

    return () => clearTimeout(timer)
  }, [isEnabled, storageKey, currentValues])

  const restore = useCallback(() => {
    const savedData = localStorage.getItem(storageKey)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        onRestore(parsed)
        setHasRestorableData(false)
      } catch (e) {
        console.error("Failed to restore local storage data", e)
      }
    }
  }, [storageKey, onRestore])

  const discard = useCallback(() => {
    localStorage.removeItem(storageKey)
    setHasRestorableData(false)
  }, [storageKey])

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey)
    setHasRestorableData(false)
  }, [storageKey])

  return {
    hasRestorableData,
    restore,
    discard,
    clear,
  }
}
