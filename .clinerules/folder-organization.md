# Folder Organization Guidelines

This document describes the general approach to organizing Next.js page development in the site, with context for AIs and developers.

## Architectural Principles

- **Headless architecture:** Integrate data from Shopify (product data), Contentful (product & page content), static configuration files, and custom helpers.
- **Composable data:** Use helpers to stitch together data from multiple sources into usable "view models" for the UI.
- **Local-first organization:** Group all files for a feature (pages, components, styles, logic) within the same directory tree, close to where they are used.
- **Dynamic routing:** Use Next.js dynamic segments (e.g., `[locale]`, `[theme]`, `[handle]`) for flexibility and scalability.
- **Kebab-case naming:** Use kebab-case for all directory and file names.

## Standard Subfolders

For each feature or page directory, use these subfolders as needed:

- `_components`: Local UI component implementations
- `_data`: Data-fetching logic, adapters, or data model code
- `_content`: CMS-specific logic/content mapping
- `_static`: Static configuration or constants for business logic
- `_helpers`: Utilities for stitching data into view models

## Example: Example Page

```
src/app/example/
  ├── page.tsx
  ├── _components/
  ├── _data/
  ├── _content/
  ├── _static/
  └── _helpers/
```

## Guidelines

- **Keep related files together:** Place components, styles, and logic for a feature in the same directory.
- **Use the standard subfolders above** for clear separation of concerns and maintainability.
- **Integrate data sources via helpers:** Use `_helpers` to combine config data into view models.
- **Prefer local configuration:** Store static config data in `_static` near the features they support.
- **Reference the example structures** to infer correct placement for new features or pages.

This approach supports scalable, maintainable Next.js development and enables AIs to generate code that fits the site's architecture.