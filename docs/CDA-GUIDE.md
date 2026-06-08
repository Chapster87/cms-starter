# Content Delivery API (CDA) - GraphQL Guide

This document outlines how to use, maintain, and implement the custom GraphQL API provided by the CMS. Unlike standard database mirrors, this API acts as a "Content Delivery API" that automatically resolves relationships and formats complex data for your frontend.

---

## 1. Schema Maintenance & Lifecycle

### Dynamic Generation

The GraphQL schema is not static. It is generated dynamically by querying the CMS registry tables (`models` and `fields`).

- **Registry Driven**: When you add a new Model or Field in the CMS dashboard, the GraphQL API detects these changes immediately.
- **Zero Migration**: You do not need to write any GraphQL code to expose new content types; the `schema-generator.ts` handles the mapping automatically.

### Naming Conventions

To keep the schema professional and industry-standard, we use the following naming logic:

| CMS Object           | GraphQL Type           | Example                |
| :------------------- | :--------------------- | :--------------------- |
| **Model**            | PascalCase             | `Teams`, `SocialLinks` |
| **Single Query**     | camelCase              | `teams(id: "...")`     |
| **Collection Query** | camelCase + Collection | `teamsCollection`      |
| **Connection**       | Type + Connection      | `TeamsConnection`      |
| **Edge**             | Type + Edge            | `TeamsEdge`            |

---

## 2. Query Guide (The CDA Pattern)

### The Relay Pattern (Edges & Nodes)

We use the Relay specification for collections. This allows for scalable pagination and metadata handling.

**Standard Collection Query:**

```graphql
query {
  teamsCollection {
    edges {
      node {
        team_name
        short_name
      }
    }
  }
}
```

### Resolving Relationships (References)

The CDA automatically resolves "Linked Records" (References). If a Team is linked to a League, you can query the League's fields directly inside the Team node.

**Nested Query Example:**

```graphql
query {
  teamsCollection {
    edges {
      node {
        team_name
        # Resolves automatically!
        league {
          name
          short_name
        }
      }
    }
  }
}
```

### Media Assets

Media fields return a structured object instead of a raw JSON string.

```graphql
query {
  teamsCollection {
    edges {
      node {
        team_logo {
          url
          name
          type
        }
      }
    }
  }
}
```

---

## 3. External Project Implementation

To use this CMS in another project (like a rugby website or mobile app), follow these steps:

### A. Environment Setup

Add these keys to your external project's `.env.local`:

```bash
CMS_API_URL="https://your-cms-deployment.com"
CMS_API_TOKEN="cms_sk_v1_..." # Found in CMS .env.local
```

### B. The Universal Hook

Create a file (e.g., `lib/cms.ts`) and add this production-ready fetcher:

```typescript
import { request } from "graphql-request"

export const cmsCacheTag = "cms-content"

/**
 * Executes a GraphQL query against the CMS Content Delivery API.
 */
export async function executeCMSQuery<
  Result = any,
  Variables = Record<string, any>,
>(
  query: string,
  options?: {
    variables?: Variables
    cache?: RequestCache
    revalidate?: number | false
  }
): Promise<Result> {
  const url = `${process.env.CMS_API_URL}/api/graphql`

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": process.env.CMS_API_TOKEN!,
  }

  // Next.js Data Cache options
  const requestInit: any = {
    cache: options?.cache ?? "force-cache",
    next: {
      tags: [cmsCacheTag],
      revalidate: options?.revalidate,
    },
  }

  return request<Result>({
    url,
    document: query,
    variables: options?.variables,
    requestHeaders: headers,
    ...requestInit,
  } as any)
}
```

### C. Usage in Server Components (Next.js)

```tsx
import { executeCMSQuery } from "@/lib/cms"

export default async function Page() {
  const data = await executeCMSQuery(`
    query {
      teamsCollection {
        edges {
          node {
            team_name
            league { name }
          }
        }
      }
    }
  `)

  return (
    <ul>
      {data.teamsCollection.edges.map(({ node }) => (
        <li key={node.team_name}>
          {node.team_name} - {node.league?.name}
        </li>
      ))}
    </ul>
  )
}
```

---

## 4. Security & API Keys

The Content Delivery API is protected by a secret token to prevent unauthorized access.

### Generating a New Key

If you need to rotate your key or set it up in a new environment, you can generate a secure token using this command in your terminal:

```bash
# MacOS/Linux/WSL
echo "CMS_API_TOKEN=cms_sk_v1_$(openssl rand -hex 16)"

# Windows (PowerShell)
echo "CMS_API_TOKEN=cms_sk_v1_$([guid]::NewGuid().ToString().Replace('-', ''))"
```

1.  Copy the output (e.g., `CMS_API_TOKEN=cms_sk_v1_fa59...`).
2.  Paste it into the `.env.local` file of your **CMS project**.
3.  Restart your CMS server to apply the changes.

---

## 5. Troubleshooting

- **401 Unauthorized**: Ensure the `x-api-key` header matches the `CMS_API_TOKEN` exactly.
- **"Type Query must define one or more fields"**: This occurs if the `models` table in Supabase is empty. Add at least one model to fix.
- **Field treats as String**: If a relationship field returns as a string, check if the linked model exists in the CMS registry.
