# Content Delivery API (CDA) - GraphQL Guide

This document outlines how to use, maintain, and implement the custom GraphQL API provided by the CMS. Unlike standard database mirrors, this API acts as a "Content Delivery API" that automatically resolves relationships and formats complex data for your frontend.

---

## 1. Schema Maintenance & Lifecycle

### The CDACore Engine

The GraphQL schema is powered by `CDACore`, a dynamic engine that translates the CMS registry into a type-safe GraphQL schema. Unlike static schemas, the CDA is fully introspectable and evolves as you change your content models.

- **Registry Driven**: When you add a new Model, Field, or Block in the CMS dashboard, the `CDACore` engine reflects these changes in the schema immediately.
- **Deep Modules**: The architecture is split into specialized modules:
  - **QueryPlanner**: Optimizes data fetching.
  - **ResolverFactory**: Standardizes how references and media are resolved.
  - **FilterEngine**: Handles complex nested filtering logic.

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

### Drafts & Preview Mode

The CDA supports a robust draft/publish workflow. By default, queries only return **published** content and show the **live** version of that content. You can control this behavior using the `preview` and `includeDrafts` arguments.

#### Arguments

| Argument        | Type      | Location           | Description                                                                                                                                                                |
| :-------------- | :-------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preview`       | `Boolean` | Query & Collection | When `true`, returns the latest saved draft content (staged) and bypasses the "published" filter. When `false` (default), returns the last published content.              |
| `includeDrafts` | `Boolean` | Collection Only    | When `true`, includes records that are currently in `draft` or `changed` status in the collection. Useful for list views that need to show all items regardless of status. |

#### Usage: Previewing Staged Content

To see what a page will look like before it is published, set `preview: true`. This is ideal for staging environments or "Preview" buttons in your frontend.

```graphql
query {
  # Returns the draft version of this specific record
  teams(id: "uuid-123", preview: true) {
    team_name
    short_name
  }
}
```

#### Usage: Including All Records

If you want to list all records but still show their live content, use `includeDrafts: true`.

```graphql
query {
  teamsCollection(includeDrafts: true) {
    edges {
      node {
        team_name
        status # 'published', 'draft', or 'changed'
      }
    }
  }
}
```

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

---

## 3. Filtering (The `where` Argument)

The CDA supports industry-standard nested filtering on all collection queries via the `where` argument. This allows you to filter records based on their own fields or the fields of their related records.

### Basic Filtering

Filter by a direct field on the model:

```graphql
query {
  teamsCollection(where: { short_name: "MLR" }) {
    edges {
      node {
        team_name
      }
    }
  }
}
```

### Nested Filtering (Relational)

You can filter based on fields in a related model (e.g., finding teams that belong to a specific league). The CDA automatically handles the necessary database joins.

```graphql
query {
  standingsCollection(
    where: { league: { short_name: "MLR" }, season: { year: 2024 } }
  ) {
    edges {
      node {
        league_standings
        league {
          name
        }
      }
    }
  }
}
```

### Technical Note: Type Safety

The `where` argument is type-safe. Each model has a corresponding `FilterInput` type (e.g., `TeamsFilterInput`) generated automatically based on its fields.

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

### Modular Content & Structured Text

These complex field types are stored as JSON but are **fully resolved** by the CDA. This means that any Media Assets or References nested within a Modular Content block or a Structured Text document will return their full objects, not just IDs.

#### Modular Content Example

The CDA uses **GraphQL Union Types** for Modular Content. This provides full type-safety and enables autocomplete in GraphQL explorers. Each block type is generated as a unique `GraphQLObjectType` (e.g., `HeroBlock`, `TextBlock`).

```graphql
query {
  pagesCollection {
    edges {
      node {
        content {
          # All blocks share metadata
          _block_type

          # Use fragments to access fields specific to each block
          ... on HeroBlock {
            title
            subtitle
            backgroundImage {
              url
            }
          }
          ... on TextBlock {
            body
            alignment # 'left', 'center', or 'right'
          }
          ... on CallToActionBlock {
            label
            link {
              # Nested references inside blocks are also resolved!
              slug
              title
            }
          }
        }
      }
    }
  }
}
```

#### Structured Text Example

Structured Text is resolved as a dedicated `StructuredText` type. It provides the raw JSON `value` (ProseMirror format) and a flattened `blocks` array containing all blocks embedded within the text, resolved via **Union Types**.

```graphql
query {
  articlesCollection {
    edges {
      node {
        body {
          # 1. The raw ProseMirror JSON
          value

          # 2. Fully resolved blocks found within the text
          blocks {
            _block_type
            ... on ImageGalleryBlock {
              images {
                url
                alt
              }
            }
            ... on CalloutBlock {
              message
              type
            }
          }
        }
      }
    }
  }
}
```

---

## 4. External Project Implementation

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

#### Standard Live Content

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

#### Previewing Drafts (Staging/Preview Routes)

For preview routes, you can pass variables to the query. Note that for preview content, you should usually disable the Next.js Data Cache (`cache: 'no-store'`).

```tsx
import { executeCMSQuery } from "@/lib/cms"

export default async function PreviewPage({ params }) {
  const data = await executeCMSQuery(
    `
    query GetTeam($id: String!, $preview: Boolean) {
      teams(id: $id, preview: $preview) {
        team_name
        short_name
      }
    }
  `,
    {
      variables: {
        id: params.id,
        preview: true,
      },
      cache: "no-store", // Don't cache preview content
    }
  )

  const team = data.teams

  return (
    <div>
      <h1>PREVIEW MODE: {team.team_name}</h1>
      {/* ... */}
    </div>
  )
}
```

---

## 5. Security & API Keys

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

## 6. Troubleshooting

- **401 Unauthorized**: Ensure the `x-api-key` header matches the `CMS_API_TOKEN` exactly.
- **"Type Query must define one or more fields"**: This occurs if the `models` table in Supabase is empty. Add at least one model to fix.
- **Field treats as String**: If a relationship field returns as a string, check if the linked model exists in the CMS registry.

---

## 7. Performance & Optimization

### Query Planning & Batched Fetching (N+1 Elimination)

The CDA is designed for performance at scale. It utilizes a `QueryPlanner` and request-scoped `BatchContext` to automatically eliminate N+1 performance issues that typically plague GraphQL APIs.

#### How it works:

1.  **ID Collection**: As the resolver tree is traversed, the engine identifies all required foreign keys (References, Media IDs, etc.) for a given level of siblings.
2.  **Batched Request**: The `QueryPlanner` executes a single `IN` query to fetch all missing records from the database in one round-trip.
3.  **Request-scoped Cache**: Once fetched, records are stored in a `BatchContext` map. If the same record (e.g., a shared "Author" or "Brand Logo") is requested multiple times within the same GraphQL request, it is returned from the local cache with zero additional database overhead.

#### Developer Impact:

- **No Manual Optimization**: You do not need to worry about query depth or collection size; the engine handles batching for all complex types:
  - **References**: Nested models.
  - **Media**: Image and file metadata.
  - **Modular Content**: Blocks and their nested references.
  - **Structured Text**: Resolved blocks within the document.
- **Predictable Performance**: Query time scales with the number of unique models involved, not the number of records returned.
