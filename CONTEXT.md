# Glossary

## Content Management System (CMS)

A system where digital content can be created, edited, and managed. In this project, it specifically refers to a custom CMS built on Supabase for a Next.js website, primarily for managing content like articles, blog posts, or pages.

## Content

Digital assets managed by the CMS, such as articles, blog posts, or web pages.

## Page Model

Refers to both the database table schema for storing page content (e.g., title, slug, body) and the Next.js page component responsible for displaying and allowing editing of this content.

## Edge Functions

Serverless functions that run at the edge of the network, closer to the user. In the context of a Supabase CMS, common use cases include:

- **Server-side rendering (SSR)**: Pre-rendering content on the server to improve initial load times and SEO.
- **Data validation**: Performing complex validation logic before data is written to the database.
- **Scheduled tasks**: Automating routine operations like publishing content or sending notifications.
- **Image optimization**: Resizing, compressing, and serving images efficiently.
- **API routing/proxying**: Creating custom API endpoints or acting as a proxy for external services.
- **Webhook handling**: Processing events from third-party services.
