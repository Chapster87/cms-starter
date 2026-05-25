import { GraphQLClient } from "graphql-request"
import { supabase } from "@/utils/supabaseClient"

const graphqlEndpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Returns a GraphQL client instance, optionally configured with an Authorization header
 * for authenticated requests.
 * @param {string | null} [accessToken] - The Supabase access token (JWT) for authenticated requests.
 *                                      If not provided, the client will use the anon key.
 * @returns {GraphQLClient} A GraphQL client instance.
 */
export async function getGraphqlClient(
  accessToken?: string | null
): Promise<GraphQLClient> {
  const headers: HeadersInit = {
    apiKey: ANON_KEY,
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  } else {
    // Attempt to get session if accessToken not explicitly provided
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      headers["Authorization"] = `Bearer ${session.access_token}`
    }
  }

  return new GraphQLClient(graphqlEndpoint, { headers })
}
