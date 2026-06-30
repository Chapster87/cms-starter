"use client"

import React, { useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { createGraphiQLFetcher } from "@graphiql/toolkit"
import { createClient } from "@/utils/supabase"

import s from "./style.module.css"

import "graphiql/style.css"

const GraphiQL = dynamic(() => import("graphiql").then((mod) => mod.GraphiQL), {
  ssr: false,
  loading: () => (
    <div className={s.container}>
      <div className={s.placeholder}>
        <p>Loading GraphQL Playground...</p>
      </div>
    </div>
  ),
})

/**
 * CDA (Content Delivery API) Playground.
 * This implementation uses the default GraphiQL 5 IDE.
 * Monaco workers are ignored to prevent UI freezes and console clutter,
 * allowing the editor to run in the main thread with zero configuration.
 */
export default function GraphQLPlayground() {
  useEffect(() => {
    // Disable Monaco workers to prevent "toUrl" crash in Next.js environment.
    // This forces the editor to run in the main thread.
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any
      win.MonacoEnvironment = {
        getWorkerUrl: () => {
          return (
            "data:text/javascript;charset=utf-8," +
            encodeURIComponent(
              "self.onmessage = function() { console.warn('Monaco worker disabled by CDA viewer'); };"
            )
          )
        },
      }
    }
  }, [])

  const fetcher = useMemo(() => {
    return createGraphiQLFetcher({
      url: "/api/graphql",
      fetch: async (url, options) => {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const headers = {
          ...options?.headers,
          "Content-Type": "application/json",
          // Add the API key if defined in env
          ...(process.env.CMS_API_TOKEN
            ? { "x-api-key": process.env.CMS_API_TOKEN }
            : {}),
          ...(session
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        }

        return fetch(url, {
          ...options,
          headers,
        })
      },
    })
  }, [])

  return (
    <div className={s.container}>
      <div className={s.playground}>
        <GraphiQL
          fetcher={fetcher}
          isHeadersEditorEnabled={true}
          shouldPersistHeaders={true}
        />
      </div>
    </div>
  )
}
