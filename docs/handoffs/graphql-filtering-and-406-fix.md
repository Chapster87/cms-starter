# Handoff: GraphQL Nested Filtering & 406 Error Resolution

## Summary

The goal was to implement nested filtering in the GraphQL CDA (Content Delivery API) to support queries like filtering standings by league short name. Additionally, a "Record Not Found" (406 Not Acceptable) issue in the editor was reported and partially investigated.

## Work Completed

- **GraphQL Nested Filtering**:
  - Updated `src/app/api/graphql/_helpers/schema-generator.ts` to support a `where` argument on collection queries.
  - Implemented dynamic `FilterInput` type generation for all models.
  - Added a recursive filter parser in the resolver that translates GraphQL `where` objects into Supabase `.eq()` filters and `!inner` joins for relational filtering.
  - Resolved numerous TypeScript and ESLint issues in the generated code, though some `any` casts remain due to the complexity of Supabase's `PostgrestFilterBuilder` generic types.
- **Documentation**:
  - Updated `docs/CDA-GUIDE.md` with a new "Filtering" section providing usage examples for basic and nested filters.

## Current State & Known Issues

- **Nested Filtering**: Functional and documented. The implementation supports filtering top-level fields and single-level nested references (e.g., `standingsCollection(where: { league: { short_name: "mlr" } })`).
- **406 Error in Editor**:
  - The user reported `406 (Not Acceptable)` errors when fetching leagues by slug (e.g., `GET .../leagues?select=*&slug=eq.midwest_womens_rugby`).
  - **Hypothesis**: This is likely a mismatch between the CMS's expectation of a `slug` column and the actual database schema (possibly named `handle` or missing).
  - **Investigation**: I have verified that `dataService.getRecordBySlug` in `src/client/data-service.ts` uses `.eq("slug", slug)`.

## Pending Tasks

1.  **Fix 406 Error**:
    - Verify the actual column names in the `leagues` table (and other models).
    - If the column is `handle`, either rename it to `slug` in the database or update the CMS registry/logic to map it correctly.
    - Use `execute_command` with a node script (see `.clinerules/sql-execution.md`) to inspect the database schema if `psql` is not direct.
2.  **Verify Standings Query**:
    - Confirm with the user that the original example query now returns the expected data through the GraphQL endpoint.

## Suggested Skills

- `grill-with-docs`: Use this to challenge the current filtering implementation against the project's domain model and ensure documentation is fully aligned.

## Relevant Files

- `src/app/api/graphql/_helpers/schema-generator.ts`: Core logic for schema and filtering.
- `docs/CDA-GUIDE.md`: Updated documentation for the API.
- `src/client/data-service.ts`: Where the editor's slug-based fetching logic resides.
- `SCHEMA.md`: Database schema reference.
