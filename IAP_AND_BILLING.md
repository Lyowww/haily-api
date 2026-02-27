# In-App Purchases and Billing (Apple IAP + Stripe)

This backend supports:

- **iOS**: Apple In-App Purchase (IAP) — receipt validation and App Store Server Notifications
- **Android / Web**: Stripe subscriptions (checkout session + webhooks)

Subscription status is stored per user with a `platform` field (`ios` | `android` | `web`). Purchase records are kept in the `purchases` table for audit and restore.

---

## 1. Database

Apply the migration so the new columns (`platform`, `apple_original_transaction_id`, `apple_product_id`, `apple_receipt_data`) and the `purchases` table exist.

**Option A – Prisma (recommended)**  
In the environment where your app runs (e.g. production with `DATABASE_URL` pointing to PostgreSQL):

```bash
npx prisma migrate deploy
```

**Option B – Manual SQL**  
If `migrate deploy` is not used (e.g. different migration history), run the SQL in  
`prisma/migrations/20260226120000_add_platform_and_purchases/migration.sql`  
against your PostgreSQL database (e.g. via Neon SQL editor or `psql`).

**Schema summary:**

- **Subscription**: `platform`, `appleOriginalTransactionId`, `appleProductId`, `appleReceiptData` (last receipt for restore), plus existing Stripe fields.
- **Purchase**: one row per verified purchase (Stripe subscription or Apple transaction) for audit and restore.

---

## 2. Environment variables

### Apple IAP (iOS)

| Variable | Description |
|----------|-------------|
| `APPLE_IAP_SHARED_SECRET` | App-specific shared secret from App Store Connect → Your App → In-App Purchases → App-Specific Shared Secret |
| `APPLE_IAP_BUNDLE_ID` | App bundle ID (e.g. `com.yourapp.haily`) — must match the app sending receipts |
| `APPLE_IAP_SANDBOX` | Omit or `true` to use sandbox first (for development); set to `false` for production-only |

### Stripe (Android / Web)

See **STRIPE_SETUP.md**. Required: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, success/cancel URLs.

### Product → Plan mapping

Edit **`src/billing/billing.constants.ts`**:

- **`APPLE_PRODUCT_TO_PLAN`**: map Apple product IDs (e.g. `com.yourapp.pro.monthly`) to plan names (`pro`, `premium`, etc.).
- **`PRICE_TO_PLAN`**: map Stripe Price IDs (e.g. `price_xxx`) to the same plan names.

---

## 3. API endpoints for the React Native app

All billing endpoints are under **`/api/billing`**. Authenticated routes require `Authorization: Bearer <jwt>`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/billing/status` | Yes | **Subscription status**: plan, platform, period start/end, cancel flag, remaining limits. |
| POST | `/billing/verify-purchase` | Yes | **Verify a purchase**: body `{ platform, receiptData? (iOS), sessionId? (Android/web) }`. Updates subscription and creates a purchase record. |
| POST | `/billing/restore` | Yes | **Restore purchases** (reinstall / new device). Body optional: `{ platform?, receiptData? }`. Tries iOS (receipt or stored) and/or Stripe. |
| GET | `/billing/products` | Yes | **Available products**: Apple product IDs and Stripe price IDs with plan mapping. |
| POST | `/billing/create-checkout-session` | Yes | Create Stripe Checkout session (Android/web). Body: `{ priceId }`. |
| POST | `/billing/cancel` | Yes | Set Stripe subscription to cancel at period end. |
| POST | `/billing/restore-subscription` | Yes | Remove cancel-at-period-end for Stripe (user undoes cancellation). |
| POST | `/billing/webhook` | No | Stripe webhook (raw body; signature in `Stripe-Signature`). |
| POST | `/billing/webhook-apple` | No | Apple App Store Server Notifications V2 (body: `{ "signedPayload": "..." }`). |

---

## 4. How verification and restore work

### 4.1 Verify purchase (POST `/billing/verify-purchase`)

- **iOS**: Send `platform: "ios"` and `receiptData` (base64 receipt from StoreKit). Backend validates with Apple and upserts subscription + purchase.
- **Android / Web**: After Stripe Checkout, send `platform: "android"` or `"web"` and `sessionId` (Stripe checkout session ID). Backend syncs subscription from Stripe (same as success-page sync).

### 4.2 Restore purchases (POST `/billing/restore`)

- **iOS**: Optionally send `receiptData` from the device; otherwise backend uses last stored `appleReceiptData` for that user. Validates with Apple and updates subscription.
- **Stripe**: Backend looks up the user’s Stripe subscription and re-syncs period and status from Stripe.

Call restore when the user reinstalls the app or switches devices.

### 4.3 Subscription status (GET `/billing/status`)

Returns plan, status, **platform** (ios | android | web), current period start/end, cancel-at-period-end flag, and remaining usage limits. Use this to gate premium map layers and features in the app.

---

## 5. Webhooks

### 5.1 Stripe (POST `/api/billing/webhook`)

- **Events**: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- **Verification**: Use raw request body and `Stripe-Signature` with `STRIPE_WEBHOOK_SECRET` (already implemented).
- See **STRIPE_SETUP.md** for URL and event list.

### 5.2 Apple App Store Server Notifications V2 (POST `/api/billing/webhook-apple`)

- **URL**: Set in App Store Connect → Your App → App Information → App Store Server Notifications → Production / Sandbox URL:  
  `https://YOUR-API-HOST/api/billing/webhook-apple`
- **Body**: JSON `{ "signedPayload": "<JWS string>" }`.
- **Handled**: Renewals (SUBSCRIBED, DID_RENEW), expiration (EXPIRED, REVOKE, REFUND, DID_FAIL_TO_RENEW with grace period expired). Subscription and purchase records are updated so status stays in sync without the app sending the receipt again.

---

## 6. Example: React Native flow

### iOS (StoreKit)

1. User completes purchase in the app; get receipt (e.g. from `SKPaymentQueue` / receipt URL).
2. Call `POST /api/billing/verify-purchase` with `{ "platform": "ios", "receiptData": "<base64>" }`.
3. On success, call `GET /api/billing/status` to refresh UI (plan, period end, limits).
4. On “Restore purchases”, call `POST /api/billing/restore` with `{ "platform": "ios", "receiptData": "<base64>" }` (or omit `receiptData` to use stored receipt if available).

### Android (Stripe)

1. User taps subscribe → app calls `POST /api/billing/create-checkout-session` with `{ "priceId": "price_xxx" }`, then opens the returned URL (Browser or WebView).
2. After payment, Stripe redirects to your success URL; backend syncs from `session_id`. Alternatively, the app can call `POST /api/billing/verify-purchase` with `{ "platform": "android", "sessionId": "<checkout_session_id>" }` if it receives the session ID (e.g. via deep link).
3. Use `GET /api/billing/status` for plan and limits.
4. On “Restore purchases”, call `POST /api/billing/restore` with `{ "platform": "android" }`.

---

## 7. Security notes

- **Receipts**: Apple receipt data is validated server-side with Apple; we store one copy per user for restore only. Do not log full receipt payloads.
- **Webhooks**: Stripe webhook must be verified with the signing secret and raw body. Apple webhook payload is signed (JWS); for production you may want to verify the certificate chain (see Apple’s docs).
- **Products**: Configure `APPLE_PRODUCT_TO_PLAN` and `PRICE_TO_PLAN` so only your real product/price IDs map to plans; unknown IDs fall back to a default plan in code.

---

## 8. Optional: StoreKit 2

StoreKit 2 uses JWT (JWS) transaction and renewal info. This backend currently uses **node-apple-receipt-verify** for the legacy receipt-based flow. For StoreKit 2–only flows you can:

- Continue sending the app receipt (base64) from the main bundle; Apple still validates it, and our backend works the same, or
- Add verification of StoreKit 2 JWTs (e.g. with `@apple/app-store-server-library`) and map `originalTransactionId` / `expiresDate` to the same subscription and purchase tables.

The existing Apple webhook (Server Notifications V2) already updates subscription and purchase rows using decoded transaction info from the signed payload.
