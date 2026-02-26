# Stripe setup for subscription registration

Subscriptions are registered in two ways:

1. **Success-page sync** – When the user is redirected after payment, the success URL is loaded with `session_id=cs_xxx`. The backend then syncs the subscription from that session. This only works if the success URL includes Stripe’s placeholder.
2. **Webhook** – Stripe sends `checkout.session.completed` (and other events) to your webhook URL. The backend updates the subscription from the event. This is required for reliability (e.g. if the user closes the browser before the success page loads).

For subscriptions to show up reliably, configure **both** below.

---

## 1. Success URL (required for success-page sync)

Stripe replaces the literal `{CHECKOUT_SESSION_ID}` in your success URL with the session ID. If you omit it, the success page never receives `session_id` and cannot sync.

Set in your env (e.g. Vercel):

- **STRIPE_SUCCESS_URL**  
  Use this **exact** pattern (replace the host with your API base URL):
  ```text
  https://YOUR-API-HOST/api/billing/payment-success?session_id={CHECKOUT_SESSION_ID}
  ```
  Example: `https://haily-api.vercel.app/api/billing/payment-success?session_id={CHECKOUT_SESSION_ID}`

- **STRIPE_CANCEL_URL**  
  No placeholder needed, e.g.:
  ```text
  https://YOUR-API-HOST/api/billing/payment-cancel
  ```

If `STRIPE_SUCCESS_URL` does **not** contain `?session_id={CHECKOUT_SESSION_ID}`, the success page will still load but the backend will not receive a session ID and will not sync the subscription from that redirect. The webhook (step 2) is then the only way to register the subscription.

---

## 2. Webhook (required for reliable subscription registration)

1. In Stripe: [Developers → Webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**.
2. **Endpoint URL**:  
   `https://YOUR-API-HOST/api/billing/webhook`  
   (same host as above, path must be `/api/billing/webhook`).
3. **Events to send**: add these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Create the endpoint, then open it and click **Reveal** under **Signing secret**.
5. Copy the value (starts with `whsec_...`) and set it in your env as **STRIPE_WEBHOOK_SECRET**.
6. Redeploy or restart your API so it uses the new secret.

If the webhook is missing, wrong URL, or wrong secret:

- Signature verification will fail and the webhook handler may return 400.
- Subscriptions will only be registered when the user actually lands on the success page with `session_id` (so if they close the tab or the success URL was wrong, the subscription never syncs).

---

## 3. Quick checklist

| Item | Where | What to set |
|------|--------|--------------|
| Success URL | Your env (e.g. Vercel) | `STRIPE_SUCCESS_URL=https://YOUR-API-HOST/api/billing/payment-success?session_id={CHECKOUT_SESSION_ID}` |
| Cancel URL | Your env | `STRIPE_CANCEL_URL=https://YOUR-API-HOST/api/billing/payment-cancel` |
| Webhook URL | Stripe Dashboard → Webhooks | `https://YOUR-API-HOST/api/billing/webhook` |
| Webhook events | Same endpoint | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |
| Signing secret | Your env | `STRIPE_WEBHOOK_SECRET=whsec_...` (from the webhook endpoint in Dashboard) |

---

## 4. Debugging

- **Subscription still not active after payment**
  - Confirm `STRIPE_SUCCESS_URL` contains `?session_id={CHECKOUT_SESSION_ID}` and uses your real API host.
  - In Stripe Dashboard → Webhooks, open your endpoint and check **Recent deliveries**. If events fail (e.g. 400), check your server logs; often the cause is wrong `STRIPE_WEBHOOK_SECRET` or the request body being modified (raw body must be used for signature verification).
- **Webhook returns 400 “Raw body required”**
  - The app is created with `rawBody: true` in `main.ts`. On Vercel, the request is passed through to Express; if you use a different deployment or proxy that parses the body before it reaches the app, the raw body may be lost and you’ll need to preserve it for the webhook path (e.g. by excluding that path from body parsing).
