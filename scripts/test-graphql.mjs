import fetch from "node-fetch"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

const CMS_API_TOKEN = process.env.CMS_API_TOKEN
const API_URL = "http://localhost:3000/api/graphql"

async function test() {
  console.log("Testing GraphQL filtering...")

  const query = `
    query StandingsQuery {
      standingsCollection(
        where: {league: {slug: "midwest_mens_rugby"}, division: {slug: "premiership-div-1"}, season: {year: 2025, season: "Fall"}}
      ) {
        edges {
          node {
            league {
              name
              slug
              short_name
            }
            season {
              year
              display_name
              season
            }
            division {
              short_name
              name
              slug
            }
            league_standings
          }
        }
      }
    }
  `

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CMS_API_TOKEN,
      },
      body: JSON.stringify({ query }),
    })

    const result = await response.json()
    console.log("GraphQL Result:", JSON.stringify(result, null, 2))

    if (result.errors) {
      console.log("\nFound errors in response.")
    } else {
      console.log("\nQuery successful!")
    }
  } catch (err) {
    console.error("Test failed:", err)
    console.log("Make sure the dev server is running at", API_URL)
  }
}

test()
