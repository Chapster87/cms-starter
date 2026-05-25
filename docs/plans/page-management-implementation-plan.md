# Page Management Implementation Plan

This document outlines the detailed steps for implementing a basic page management system, enabling Create, Read, Update, and Delete (CRUD) operations for content pages within the Supabase-backed Next.js CMS.

## Summary of Agreed-Upon Terms

- **Content Management System (CMS)**: A system for creating, editing, and managing digital content, specifically built on Supabase for a Next.js website.
- **Content**: Digital assets such as articles, blog posts, or web pages, stored and managed within the Supabase database.
- **Edge Functions**: Serverless functions that run at the edge of the network, closer to the user. In the context of a Supabase CMS, common use cases include: server-side rendering, data validation, scheduled tasks (e.g., publishing content), image optimization, custom API routing, and webhook handling.
- **Page Model**: Refers to both the database table schema for storing page content (e.g., title, slug, body) and the Next.js page component responsible for displaying and allowing editing of this content.

## Detailed Implementation Plan

### Phase 1: Supabase Setup and Database Schema

1.  **Supabase Project Initialization**:
    - [x] Create a new Supabase project on the Supabase platform.
    - [x] Retrieve the project's API keys (Anon Key, Service Role Key) and project URL.
2.  **Environment Variables**:
    - [x] Configure the Next.js project's `.env.local` file with the Supabase connection details (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
    - [x] Ensure secure handling of these variables.
3.  **Database Schema Definition**:
    - [x] Define a `pages` table in Supabase.
    - [x] Table structure:
      ```sql
      CREATE TABLE public.pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ```
    - [x] Add a trigger to automatically update `updated_at` on row changes.
4.  **Row Level Security (RLS)**:
    - [x] Enable RLS for the `pages` table.
    - [x] Define basic RLS policies:
      - `SELECT`: Allow all users (anon, authenticated) to read pages.
      - `INSERT`, `UPDATE`, `DELETE`: Allow only authenticated users (or specific roles, to be refined later) to create, update, and delete pages.
5.  **Enable GraphQL Introspection**:
    - [x] Execute the following SQL command in Supabase to enable GraphQL introspection:
      ```sql
      comment on schema public is E'@graphql({"introspection": true})';
      ```

### Phase 2: Supabase Client and GraphQL Integration

1.  **Install Supabase Client**:
    - [x] Add the `@supabase/supabase-js` package to the Next.js project.
    ```bash
    pnpm add @supabase/supabase-js
    ```
2.  **Initialize Supabase Client**:
    - [x] Create a utility file (e.g., `src/utils/supabaseClient.ts`) to initialize and export the Supabase client instance.

    ```typescript
    // src/utils/supabaseClient.ts
    import { createClient } from "@supabase/supabase-js"

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    export const supabase = createClient(supabaseUrl, supabaseAnonKey)
    ```

3.  **Frontend GraphQL Client**:
    - [x] Install a lightweight GraphQL client (e.g., `graphql-request`).

    ```bash
    pnpm add graphql-request graphql
    ```

    - [x] Create a utility for GraphQL requests (e.g., `src/client/graphqlClient.ts`) to interact directly with the Supabase auto-generated GraphQL endpoint (`https://<PROJECT_REF>.supabase.co/graphql/v1`). The client now dynamically includes the authenticated user's JWT in the Authorization header.

    ```typescript
    // src/client/graphqlClient.ts (Updated for dynamic authentication)
    import { GraphQLClient } from "graphql-request"
    import { supabase } from "@/utils/supabaseClient"

    const graphqlEndpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    export async function getGraphqlClient(
      accessToken?: string | null
    ): Promise<GraphQLClient> {
      const headers: HeadersInit = {
        apiKey: ANON_KEY,
      }

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          headers["Authorization"] = `Bearer ${session.access_token}`
        }
      }

      return new GraphQLClient(graphqlEndpoint, { headers })
    }
    ```

### Phase 3: Next.js API Routes (Optional Edge Functions) for CRUD

1.  **Create API Routes (if needed)**:
    - [x] For basic CRUD, direct GraphQL mutations will be used. (This implies this optional step is "complete" by not being needed for basic CRUD).
    - If complex server-side logic (e.g., integrating with external APIs, custom business rules beyond RLS) is required, Next.js API routes (which can be deployed as Edge Functions) can be created in `src/app/api/pages/` to abstract interactions with Supabase or other services.
    - Example: `src/app/api/pages/[id]/route.ts` for specific page operations.
2.  **Data Validation**:
    - [x] Implement any complex server-side input validation within these optional API routes. (Handled client-side for basic validation, server-side via RLS and DB constraints for now).

### Phase 4: Frontend Page Management Component

1.  **Page List Component**:
    - [x] Location: `src/app/dashboard/pages/_components/page-list.tsx`
    - [x] Functionality: Displays a list of all pages fetched via GraphQL, with actions to view, edit, and delete.
    - [x] GraphQL Query: Fetch `id`, `title`, `slug`, `updated_at` for all pages.
2.  **Page Form Component**:
    - [x] Location: `src/app/dashboard/pages/_components/page-form.tsx`
    - [x] Functionality: A form for creating new pages or editing existing ones.
    - [x] UI: Implemented basic form styling, including Radix UI Label and button styles, and adhered to new CSS guidelines.
    - [x] GraphQL Mutations: Implement `insertPage`, `updatePage` mutations, including resolution of RLS policy violation for authenticated CRUD operations by sending JWT with GraphQL requests.
    - [x] **Addendum**: Implemented `refreshTrigger` to ensure the page list on `/pages` updates immediately after CRUD actions.
3.  **Dynamic Routing**:
    - [x] Set up Next.js dynamic routes for editing individual pages: `/pages/[id]/edit`. This route renders the `PageFormComponent` pre-filled with existing page data.
    - [x] Created `src/app/pages/new/page.tsx` for creating new pages.
    - [x] Modified `src/app/pages/page.tsx` to navigate to `/pages/new` and `/pages/[id]/edit`.
4.  **Radix Primitives Integration**:
    - [x] Ensured all UI components within the list and form views leverage Radix Primitives for accessibility and consistent styling by applying appropriate CSS classes and using Radix Label.

### Phase 5: Authentication Portal and Routing

1.  **Google OAuth Provider Setup**:
    - [x] Enabled Google as an OAuth provider in Supabase Studio.
    - [x] Obtained Google Client ID and Client Secret from Google Cloud Console.
    - [x] Configured Supabase redirect URL in Google Cloud Console.
    - [x] Added `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET` to `.env.local`.
    - [x] Restricted new sign-ups via Google OAuth by disabling "Allow new users to sign up" in Supabase.
2.  **Authentication Page (`src/app/auth/page.tsx`)**:
    - [x] Created a client-side page for user authentication.
3.  **Authentication Form Component (`src/app/auth/_components/auth-form/index.tsx`)**:
    - [x] Implemented Google sign-in logic using `supabase.auth.signInWithOAuth`.
    - [x] Styled form elements (button) with Radix UI patterns and new CSS guidelines (`src/app/auth/_components/auth-form/style.module.css`).
4.  **Supabase OAuth Callback Route (`src/app/auth/callback/route.ts`)**:
    - [x] Created a Next.js API route to handle OAuth redirects, exchanging authorization codes for sessions using direct `@supabase/supabase-js` client.
5.  **Site Routing Adjustments**:
    - [x] Moved dashboard content from `src/app/dashboard/page.tsx` to `src/app/page.tsx`, making the root route (`/`) the homepage.
    - [x] Deleted the redundant `src/app/dashboard/page.tsx`.
    - [x] Updated the OAuth callback route (`src/app/auth/callback/route.ts`) to redirect to the homepage (`/`) after successful login.
    - [x] Updated internal links from `/dashboard/pages` to `/pages`.

This plan provides a clear roadmap to build and manage the core features of your CMS. The authentication portal and routing are now in place.
