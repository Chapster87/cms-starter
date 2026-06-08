import { NextRequest, NextResponse } from "next/server"
import { graphql } from "graphql"
import { createClient } from "@/utils/supabase-server"
import { generateSchema } from "./_helpers/schema-generator"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key")
    const expectedKey = process.env.CMS_API_TOKEN
    let isAuthorized = false

    if (expectedKey && apiKey === expectedKey) {
      isAuthorized = true
    } else {
      const supabase = await createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) isAuthorized = true
    }

    if (!isAuthorized && expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { query, variables } = await req.json().catch(() => ({}))

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 })
    }

    const schema = await generateSchema()
    const result = await graphql({
      schema,
      source: query,
      variableValues: variables,
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error("GraphQL Route Error:", err)
    const error = err as Error
    return NextResponse.json(
      { error: error.message || "Internal Server Error", details: err },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
    },
  })
}
