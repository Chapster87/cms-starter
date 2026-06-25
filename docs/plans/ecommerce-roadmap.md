# E-commerce Integration Roadmap (Stripe + CMS)

This document outlines the architectural decisions and implementation strategy for integrating e-commerce capabilities into the CMS.

## 1. Architectural Strategy: Hybrid Source of Truth

To ensure professional content management while leveraging Stripe's robust financial infrastructure, we utilize a split-responsibility model.

- **CMS (Primary Source for Content):** Acts as the source of truth for marketing descriptions, media galleries, SEO metadata, technical specifications, and the product/variant relationship.
- **Stripe (Primary Source for Transactions):** Acts as the source of truth for checkout sessions, payment processing, tax calculation, and historical financial data.

## 2. Data Modeling: Product & Variant Relationship

We implement a dedicated, hierarchical model structure to support SKU-level tracking.

### Product Model

- **Purpose:** Represents the marketing entity (e.g., "Performance Running Tee").
- **Fields:** Title, Description, Media Gallery, Category (Reference), SEO Metadata.

### Product Variant Model

- **Purpose:** Represents the purchasable SKU (e.g., "Blue / Large").
- **Relationship:** Many-to-One with Product.
- **Key Fields:**
  - `sku`: Unique identifier.
  - `price`: Numeric field (Base Currency).
  - `inventory_count`: Physical stock.
  - `reserved_count`: Stock held in active checkout sessions.
  - `stripe_price_id`: System field (populated via sync).
  - `stripe_product_id`: System field (populated via sync).
  - `attributes`: JSONB or Reference fields for Size, Color, etc.

## 3. Inventory Management: Reserved vs. Available

To prevent race conditions and over-selling, we use a two-step reservation system.

1.  **Checkout Initiation:** When a user starts a Stripe checkout, an RPC `reserve_inventory(variant_id)` is called. This increments `reserved_count` if `(inventory_count - reserved_count) > 0`.
2.  **Success (Webhook):** On `checkout.session.completed`, the system decrements both `inventory_count` and `reserved_count`.
3.  **Failure/Expiry (Webhook):** On `checkout.session.expired` or `payment_intent.payment_failed`, the system decrements `reserved_count`, releasing the item back to the shelf.

## 4. Stripe Synchronization

We use **Automated Background Synchronization** to maintain parity between the CMS and Stripe.

- **Sync Trigger:** Occurs either via a manual "Sync" button in the Variant editor or automatically upon record `Publish`.
- **Logic:** A Server Action checks for the existence of the `stripe_product_id`. If missing (or if content has changed), it updates/creates the Product and Price in Stripe and saves the resulting IDs back to the CMS record.
- **Security:** Stripe Secret Keys are stored in environment variables; no financial keys are exposed to the frontend.

## 5. Pricing & Currency

- **Global Settings:** Store-wide base currency (e.g., USD) is defined in `/settings/site`.
- **MVP Approach:** Single currency pricing for initial launch.
- **Future Expansion:** Add a `price_overrides` JSONB field to the Variant model for manual multi-currency support if auto-conversion via Stripe is insufficient.

## 6. Admin Experience: Hybrid Dashboard

We provide visibility without duplicating complex financial tools.

- **Orders View:** A read-only record list in the CMS populated by `checkout.session.completed` webhooks.
- **Order Details:** Displays customer name, items purchased, and status (Paid, Processing, etc.).
- **Action Bridge:** Each order includes a prominent "View in Stripe" button for handling refunds, customer support, and fulfillment.

## 7. Implementation Milestones

1.  **Phase 1 (Models):** Create Product and Product Variant models in Schema Builder.
2.  **Phase 2 (Stripe Bridge):** Implement Server Actions for Stripe Product/Price creation.
3.  **Phase 3 (Inventory):** Write Postgres RPCs for atomic inventory reservation.
4.  **Phase 4 (Webhooks):** Set up Next.js API route for Stripe Webhook ingestion.
5.  **Phase 5 (Orders):** Create the Orders dashboard and deep-linking UI.
