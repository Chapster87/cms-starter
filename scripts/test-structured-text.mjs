import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

const CMS_API_TOKEN = process.env.CMS_API_TOKEN
const API_URL = "http://localhost:3000/api/graphql"

async function test() {
  console.log("Testing Structured Text in GraphQL...")

  const query = `
    query PagesQuery {
      pagesCollection {
        edges {
          node {
            id
            title
            slug
            structured_text
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
