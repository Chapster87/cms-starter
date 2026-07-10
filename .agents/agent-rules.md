CRITICAL: Before calling attempt_completion, you MUST:

1. Run all tests and verify they pass.
2. Run ESLint and fix any warnings and errors found.
3. Verify all explicit requirements have been met.
4. List each requirement and explicitly confirm its completion.
   Failure to verify these steps before completion is a critical error.

### Component Architecture & Scaling

- **Avoid "God Components"**: When creating complex forms or modals (like those in `/schema` or `/editor`), do not build a single massive file.
- **Modular First**: Break down complex interfaces into sub-components immediately. Place these in a local `_components` directory within the feature folder.
- **Registry Pattern**: For entities with many variations (like CMS field types), use a registry-based approach. Create a central registry component that delegates rendering to specialized sub-components.
- **State Orchestration**: Keep core state in the parent "Container" component and pass necessary props/setters to sub-components to maintain a predictable data flow.
- **Local Logic**: Keep logic (like validation or specific field formatting) within the sub-component it belongs to, rather than centralizing it all in the parent's `handleSubmit`.
- **Zero-Prop Pattern**: Favor components that manage their own state or data fetching where appropriate to reduce prop drilling and maintain loose coupling.
- **Feature Hooks**: Proactively extract logic from `.tsx` files into local `.ts` hooks files within a `_hooks` directory.
- **Directory Scoping**: Maintain the `_components`, `_data`, `_hooks`, `_helpers` structure within feature folders to keep the project root clean and maintain high locality.
