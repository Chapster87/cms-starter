# Handoff: GraphQL Relationship Filtering Fix

## Summary

Attempted to resolve the error `"Could not find a relationship between 'standings' and 'leagues' in the schema cache"` occurring during nested filtering in the GraphQL Content Delivery API.

## Work in Progress

### Current Investigation

- **Registry Check**: Verified the CMS registry. The `standings` model has a `table_name` of `standings`. The `league` field on `standings` is a reference to the `leagues` table (ID: `e779ad6f-72cb-4720-a30a-2eed0b12d838`).
- **PostgREST Behavior**: The error indicates that Supabase's PostgREST cannot find a foreign key relationship between the tables when using certain join syntaxes.
- **Resolver Logic**: The logic in `src/app/api/graphql/_helpers/schema-generator.ts` responsible for building the PostgREST query is `needsInnerJoins` and `applyFilters`.

### Challenges Encountered

- **Join Syntax**: Tried multiple variations of the explicit join syntax:
  - `${key}:${linkedModel.table_name}!inner(id)` (e.g., `league:leagues!inner(id)`)
  - `${linkedModel.table_name}!inner(id)` (e.g., `leagues!inner(id)`)
- **Error Evolution**:
  - Initially: `Could not find a relationship between 'standings' and 'leagues'`.
  - At one point changed to: `'league' is not an embedded resource in this request` when the join hint didn't match the filter path.
  - Also saw: `'division' is not an embedded resource` when testing nested joins.

### Key Files

- `src/app/api/graphql/_helpers/schema-generator.ts`: Contains the `applyFilters` and `needsInnerJoins` functions where the join string is constructed.
- `scripts/debug-registry.mjs`: Utility script created to verify model/field relationships.
- `scripts/test-graphql.mjs`: Utility script created to trigger the error via a local GraphQL query.

## Next Steps

1. **Verify Database Relationships**: Use the Supabase Dashboard to confirm that the `standings` table has a physical foreign key column (likely named `league` or `league_id`) pointing to `leagues.id`.
2. **Correct Join Alias**: PostgREST requires the join hint to match the column name or relationship name. If the column is `league`, the join should likely be `league:leagues(...)`.
3. **Synchronize Paths**: Ensure that the `path` passed to `applyFilters` matches exactly the alias defined in `needsInnerJoins`.
4. **Fix Recursion**: The current recursion logic for nested joins (e.g., `standings -> league -> division`) needs careful string concatenation to produce valid PostgREST embedded resource paths.

## Suggested Skills

- `grill-with-docs`: Use this to stress-test the PostgREST join syntax logic against the project's documentation and Supabase best practices.
