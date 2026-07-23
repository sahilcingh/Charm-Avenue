# Next.js

A modern Next.js 15 application built with TypeScript and Tailwind CSS.

## 🚀 Features

- **Next.js 15** - Latest version with improved performance and features
- **React 19** - Latest React version with enhanced capabilities
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development

## 🛠️ Installation

1. Install dependencies:
  ```bash
  npm install
  # or
  yarn install
  ```

2. Start the development server:
  ```bash
  npm run dev
  # or
  yarn dev
  ```
3. Open [http://localhost:4028](http://localhost:4028) with your browser to see the result.

## 📁 Project Structure

```
nextjs/
├── public/             # Static assets
├── src/
│   ├── app/            # App router components
│   │   ├── layout.tsx  # Root layout component
│   │   └── page.tsx    # Main page component
│   ├── components/     # Reusable UI components
│   ├── styles/         # Global styles and Tailwind configuration
├── next.config.mjs     # Next.js configuration
├── package.json        # Project dependencies and scripts
├── postcss.config.js   # PostCSS configuration
└── tailwind.config.js  # Tailwind CSS configuration

```

## 🧩 Page Editing

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## 🎨 Styling

This project uses Tailwind CSS for styling with the following features:
- Utility-first approach for rapid development
- Custom theme configuration
- Responsive design utilities
- PostCSS and Autoprefixer integration

## 📦 Available Scripts

- `npm run dev` - Start development server on port 4028
- `npm run build` - Build the application for production
- `npm run start` - Start the development server
- `npm run serve` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## 🗄️ Database Setup (Supabase)

This app is Supabase-backed (products, categories, auth, wishlist, orders). On
a fresh Supabase project, run the SQL files in `supabase/` **in this order**
via the Supabase SQL Editor — several depend on tables/functions created by
earlier ones:

1. `schema.sql` — base schema: `products`, `categories`, the `product-images`
   storage bucket and its public-read policy.
2. `security-migration.sql` — `profiles` table, admin/customer role
   separation, and the `is_admin()` helper every later migration relies on.
3. `wishlist-migration.sql` — customer wishlist (`wishlist_items`).
4. `admin-audit-log-migration.sql` — `admin_audit_log` (who did what, when).
5. `profile-contact-fields-migration.sql` — adds `phone`/`address` to
   `profiles`, for checkout pre-fill.
6. `orders-migration.sql` — `orders` + `order_items` (checkout requires login;
   every order belongs to a signed-in customer).
7. `orders-require-login-migration.sql` — only needed if you ran the original
   version of `orders-migration.sql` before it required a non-null `user_id`;
   tightens an existing table to match. Skip this on a fresh project.
8. `orders-admin-dashboard-migration.sql` — only needed if you ran
   `orders-migration.sql` before it added the `updated_at` trigger; keeps
   order rows current when an admin changes status from `/admin/orders`.
   Skip this on a fresh project.
9. `storage-file-size-limit.sql` — caps the `product-images` bucket at 10MB,
   matching the app's own upload limits.
10. `storage-policies.sql` — only needed if the `product-images` bucket was
    created manually via the Dashboard instead of by `schema.sql`'s own
    `insert into storage.buckets` statement; redundant otherwise.
11. `products-phase1-migration.sql` — adds optional sale-window, stock &
    availability, personalization, and detail (dimensions/material/care)
    columns to `products`. Purely additive — every existing product is
    unaffected until an admin opts into one of these fields.
12. `products-phase2-migration.sql` — adds `product_images` (optional
    supplementary photos shown after the main one on the product detail
    page). `products.image`/`image_alt` stay the permanent "main photo" used
    everywhere (cards, cart, gallery hero) — no separate cover to manage.
13. `products-phase3-migration.sql` — adds `tags` (an admin-curated list),
    `product_tags`, and `product_categories` (extra categories beyond the
    existing required primary `category_slug`, which is untouched).
    Backfills `product_categories` from every product's current
    `category_slug` so multi-category reads never need to branch between
    old and new products.
14. `products-phase4-migration.sql` — adds `product_variants` (optional
    color/size options, each with an optional price/stock/image override).
    A product with zero variants sells exactly as it does today.
15. `products-phase5-migration.sql` — adds `variant_id`/`variant_label`/
    `variant_image`/`personalization_text` to `order_items`, so the admin
    can see exactly which variant and personalization text a customer
    ordered. Snapshotted at order time, same as `product_name`/`unit_price`.
16. `products-phase6-migration.sql` — adds `stock_count` to `products`, so a
    product with no variants can show a real "only N left" low-stock warning
    (variants already had their own `stock_count` since Phase 4).
17. `products-phase7-migration.sql` — adds `combos`/`combo_products` (a
    discount rule across 2+ independently-sold products, not a bundle
    product) and `discount_total` on `orders` so admins can see how much of
    an order's total came from a combo discount.

Also see `.env.example` for every environment variable the app reads,
including which ones are required vs. which gate an optional feature
(`SUPABASE_SERVICE_ROLE_KEY`, needed only for the Cashfree payment webhook)
vs. which are inactive placeholders until a future integration is turned on
(`CASHFREE_*`).

## 📱 Deployment

Build the application for production:

  ```bash
  npm run build
  ```

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🙏 Acknowledgments

- Built with [Rocket.new](https://rocket.new)
- Powered by Next.js and React
- Styled with Tailwind CSS

Built with ❤️ on Rocket.new