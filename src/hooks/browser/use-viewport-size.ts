import { useState, useLayoutEffect } from "react"

const queries = {
  small: "(max-width: 767px)",
  medium: "(min-width: 768px) and (max-width: 1024px)",
  mediumUp: "(min-width: 768px)",
  large: "(min-width: 1024px)",
}

export function useViewportSize() {
  const [matches, setMatches] = useState({
    small: false,
    medium: false,
    mediumUp: false,
    large: false,
  })

  useLayoutEffect(() => {
    const mediaQueries = Object.entries(queries).map(([key, query]) => ({
      key,
      list: window.matchMedia(query),
    }))

    const handler = () => {
      setMatches(
        mediaQueries.reduce(
          (acc, { key, list }) => ({
            ...acc,
            [key]: list.matches,
          }),
          {} as typeof matches
        )
      )
    }

    // Initial check
    handler()

    mediaQueries.forEach(({ list }) => {
      list.addEventListener("change", handler)
    })

    return () => {
      mediaQueries.forEach(({ list }) => {
        list.removeEventListener("change", handler)
      })
    }
  }, [])

  return matches
}
