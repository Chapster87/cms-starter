import { useCallback, useRef } from "react"

/**
 * A hook that returns a debounced version of the provided function.
 *
 * @param callback The function to debounce.
 * @param delay The delay in milliseconds.
 * @returns A debounced function.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}
