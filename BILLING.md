# Billing (Stripe subscriptions & usage)

## Environment variables

- `STRIPE_SECRET_KEY` – Stripe secret key (required for checkout, webhook, cancel, restore).
- `STRIPE_WEBHOOK_SECRET` – Stripe webhook signing secret (required for `POST /api/billing/webhook`).
- `STRIPE_SUCCESS_URL` – Full URL Stripe redirects to after successful payment (e.g. `https://your-api.vercel.app/api/billing/payment-success`). Required for checkout.
- `STRIPE_CANCEL_URL` – Full URL Stripe redirects to when user cancels (e.g. `https://your-api.vercel.app/api/billing/payment-cancel`). Required for checkout.
- `STRIPE_SUCCESS_REDIRECT` – (Optional) Where the success page redirects the user (e.g. `haily://payment-success`). Defaults to `haily://payment-success`.
- `STRIPE_CANCEL_REDIRECT` – (Optional) Where the cancel page redirects the user (e.g. `haily://payment-cancel`). Defaults to `haily://payment-cancel`.

If Stripe keys are not set, billing endpoints that call Stripe will return 400 "Billing is not configured." The backend serves `GET /api/billing/payment-success` and `GET /api/billing/payment-cancel`, which respond with a 302 redirect to the app deep link (or the optional redirect URLs above).

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/billing/create-checkout-session` | JWT | Create Stripe Checkout session; body: `{ "priceId": "price_xxx" }`. Returns `{ "url": "https://checkout.stripe.com/..." }`. |
| POST | `/api/billing/webhook` | Stripe signature | Stripe webhook: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. |
| GET | `/api/billing/status` | JWT | Subscription status and remaining limits: `plan`, `status`, `currentPeriodEnd`, `limits.aiRemaining`, `limits.virtualRemaining`, `limits.weeklyRemaining`. |
| POST | `/api/billing/cancel` | JWT | Set `cancel_at_period_end: true` on the subscription. |
| POST | `/api/billing/restore` | JWT | Clear `cancel_at_period_end` (e.g. after reinstall). |

## Protected routes (subscription + limits)

- `POST /api/ai/generate-outfit` – requires active subscription; counts against AI and virtual try-on limits.
- `POST /api/outfit/weekly/generate` – requires active subscription; counts against weekly generation limit.

When subscription is inactive or a limit is exceeded, the API returns 403 with a message such as "Subscription required" or "Limit reached".

## Plan limits

Defined in `src/billing/billing.constants.ts`:

- **starter**: ai 3, virtualTryOn 3, weekly 1.
- **pro** / **premium**: unlimited (-1).

Map Stripe price IDs to plan names in `PRICE_TO_PLAN` in the same file (e.g. `'price_xxx': 'starter'`).

## Usage table and migration

The `usage` table stores per-user, per-month counters: `ai_generations_count`, `virtual_tryon_count`, `weekly_generation_count`. It is created by Prisma migrations.

If you cannot run `prisma migrate dev` (e.g. provider mismatch), create the table manually (PostgreSQL):

```sql
CREATE TABLE "usage" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "ai_generations_count" INTEGER NOT NULL DEFAULT 0,
  "virtual_tryon_count" INTEGER NOT NULL DEFAULT 0,
  "weekly_generation_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "usage_user_id_month_key" UNIQUE ("user_id", "month")
);
CREATE INDEX "usage_user_id_idx" ON "usage"("user_id");
CREATE INDEX "usage_month_idx" ON "usage"("month");
ALTER TABLE "usage" ADD CONSTRAINT "usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Monthly reset

A cron job runs on the 1st of each month (`UsageCronService`) and resets the **previous** month’s usage counts. New months get new rows automatically via upsert.

## Raw body for webhook

`main.ts` creates the app with `rawBody: true` so Stripe’s webhook signature can be verified. Do not disable this if you use the billing webhook.
