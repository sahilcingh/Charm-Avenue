# Supabase Migration Contingency Plan

**Purpose:** a reference plan for moving off Supabase (in whole or in part) if the free
tier ever becomes a real blocker — either the Cached Egress cap keeps getting hit even
after the caching/thumbnail fixes, or another limit (database size, storage size) becomes
the constraint. This is a planning document, not a task in progress — nothing here has
been started.

---

## 1. First, understand what "Supabase" actually means for this app

Supabase isn't one thing — this project uses **three separate services** under one
umbrella, and they can be migrated independently:

| Service | What it does here | Where it's used in code |
|---|---|---|
| **Postgres Database** | Products, orders, categories, tags, combos, homepage sections, profiles — every table, plus all the Row Level Security (RLS) policies that gate who can read/write what | `src/lib/supabase/*.ts`, every `supabase/*.sql` migration file |
| **Auth** | Customer login/signup, admin login, session cookies | `src/lib/supabase/server.ts`, `client.ts`, `middleware.ts`, `src/app/login/`, `src/app/signup/` |
| **Storage** | Product/category photo files (the `product-images` bucket) | `src/app/admin/(protected)/products/actions.ts`, `.../categories/actions.ts`, `image-hosts.config.mjs` |

**Important:** the Cached Egress problem that triggered this whole investigation is
**Storage traffic, not the database**. Your Database Size usage is at ~6% and Egress
(non-cached) is at ~7% — nowhere near a limit. So the fastest, lowest-risk fix is almost
always **Option A below (move only Storage)**, not a full platform migration.

---

## 2. Option A — Move only image storage (fastest, lowest risk)

**When to use this:** if Cached Egress keeps climbing even after the caching fixes,
but the database/auth are working fine. This is the move that directly targets the
actual bottleneck.

**Best replacement: Cloudflare R2**
- Free tier: 10 GB storage, and — critically — **zero egress fees, ever**. Egress is
  exactly what's costing you on Supabase; R2 doesn't charge for it at all, on any plan.
- S3-compatible API, so it's a well-trodden path with lots of documentation.

**Alternative: Vercel Blob** — since the site is already deployed on Vercel, this needs
zero new accounts and integrates natively. Smaller free tier than R2, but the simplest
possible setup if you want to stay entirely inside Vercel's ecosystem.

### Steps

1. **Create the new storage bucket** (R2 bucket, or Vercel Blob store) and set it to
   allow public read access — same as the current `product-images` Supabase bucket.

2. **Copy existing files across.** Every product/category photo currently lives at a
   Supabase Storage public URL (`https://<project>.supabase.co/storage/v1/object/public/product-images/...`).
   Write a one-off script that:
   - Reads every row's `image` column from `products`, `product_variants`, `product_images`, and `categories`
   - Downloads each file from its current Supabase URL
   - Re-uploads it to the new bucket
   - Updates that row's `image` column to the new URL
   This is a database write, not a schema change — the app doesn't need to know the
   history of where a photo used to live.

3. **Swap the upload code.** Only two functions in the whole app write to Storage:
   - `uploadImageIfProvided()` in `src/app/admin/(protected)/products/actions.ts`
   - `uploadCategoryImageIfProvided()` in `src/app/admin/(protected)/categories/actions.ts`
   Both currently call `supabase.storage.from('product-images').upload(...)`. Replace
   the body of each with the equivalent R2/Vercel Blob SDK call. The function
   signatures (`(supabase, formData) => Promise<string | null>`) don't need to change —
   only what's inside them.

4. **Update `image-hosts.config.mjs`.** Add the new storage domain's hostname to the
   `imageHosts` array (same pattern as the existing `*.supabase.co` entry) so
   Next.js's image optimizer is allowed to fetch from it. You can leave the
   `*.supabase.co` entry in place until every old image URL has been migrated.

5. **Add the new credentials** to `.env` / Vercel's environment variables (e.g.
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, or
   Vercel Blob's single `BLOB_READ_WRITE_TOKEN`).

6. **Test on a preview deploy first** — upload a new product photo, confirm it lands
   in the new bucket and displays correctly, before relying on it in production.

**Estimated effort:** a few hours for the code swap; the one-off migration script's
runtime depends on how many photos you have (dozens of products = minutes, not hours).

**What doesn't change:** the database, RLS, auth, admin panel, checkout flow — none of
it. This is a surgical, contained change.

---

## 3. Option B — Full platform migration (only if Supabase itself becomes untenable)

**When to use this:** database size or another Supabase-specific limit becomes the
actual blocker, not just Storage egress — or you want to leave Supabase entirely for
other reasons (cost, vendor preference, etc.).

### 3a. Database → keep it Postgres, just move hosting

Since Supabase's database is just managed Postgres, the least disruptive move is to
another Postgres host — **not** a different database engine (switching to MySQL/etc.
would require rewriting every query and the RLS security model from scratch).

Best options, easiest first:
- **Vercel Postgres** (built on Neon) — since the app is already on Vercel, this is a
  few clicks to provision, and Vercel injects the connection env vars automatically.
- **Neon directly** — same underlying tech, generous free tier, framework-agnostic.
- **Railway / Render Postgres** — similarly simple, good free/cheap tiers.

Steps:
1. Export the schema and data: every table definition lives across the numbered
   `supabase/*.sql` migration files in this repo — run them in order against the new
   database to recreate the schema, then use `pg_dump`/`pg_restore` (or the Supabase
   dashboard's export tool) to copy the actual data across.
2. Recreate the `is_admin()` function and all RLS policies exactly as written in
   `security-migration.sql` and every `products-phase*-migration.sql` file — these are
   plain Postgres SQL, not Supabase-proprietary, so they run unchanged on any Postgres host.
3. Replace `src/lib/supabase/server.ts`, `client.ts`, `middleware.ts`,
   `public-client.ts`, `service-client.ts` with an equivalent Postgres client (e.g.
   `postgres.js` or `pg`, wired the same way).
4. Update `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.example` and Vercel's environment variables to
   the new connection details.

### 3b. Auth → the hardest, most disruptive piece

This is genuinely the biggest chunk of work, because Supabase Auth currently handles
password hashing, session cookies, and email confirmation out of the box. Realistic
options:
- **Auth.js (NextAuth)** — the standard choice for Next.js, well-documented, free.
- **Clerk** — fastest to set up, has its own free tier, but is a third product/cost
  to manage.

Either way, this means rewriting `src/app/login/LoginForm.tsx`, `src/app/signup/SignupForm.tsx`,
`src/lib/admin-mode-context.tsx`, `src/lib/session-refresh.ts`, and the admin route
protection in `src/app/admin/(protected)/layout.tsx` — plus migrating existing users'
accounts, which isn't a clean export/import (passwords are hashed and not portable
between auth providers; existing customers would likely need to reset their password
once, at minimum).

### 3c. Storage → same as Option A above.

**Estimated effort for full migration:** this is a multi-day project, not a same-day
fix — mainly because of Auth. If you're ever considering this, do it as a planned,
tested migration on a quiet week, not as an emergency response to hitting a quota.

---

## 4. Recommendation

- **Right now:** the caching/thumbnail fixes already pushed should meaningfully reduce
  Cached Egress going forward. Watch next billing cycle's numbers before assuming a
  migration is needed at all.
- **If Storage egress alone keeps being the problem:** do Option A (Cloudflare R2).
  It's the correct-sized fix for the actual bottleneck, low-risk, and can be done in a
  few hours without touching auth or the database.
- **Full migration (Option B)** is a last resort — reach for it only if you're leaving
  Supabase for reasons beyond this one metric, since Auth migration alone is a
  significant, carefully-tested undertaking, not something to attempt "asap" under
  pressure.
