"use client"

import React, { useMemo } from "react"
import { createGraphiQLFetcher } from "@graphiql/toolkit"
import { GraphiQL } from "graphiql"
import { createClient } from "@/utils/supabase"

import s from "./style.module.css"

import "graphiql/style.css"

/**
 * CDA (Content Delivery API) Playground.
 * This implementation uses the default GraphiQL 5 IDE.
 * Monaco workers are ignored to prevent UI freezes and console clutter,
 * allowing the editor to run in the main thread with zero configuration.
 */
export default function GraphQLPlayground() {
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
