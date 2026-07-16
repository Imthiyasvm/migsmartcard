# Ziina Payment Gateway Setup (AED)

MigSmartCard accepts real payments in **UAE dirhams (AED)** through
[Ziina](https://ziina.com) — for subscription upgrades and physical NFC card
orders. Until the API key is configured, all billing/ordering runs in
**simulated mode** (no real charge), so development and demos work unchanged.

## 1. Get your API token

1. Log in to <https://dashboard.ziina.com>
2. Go to **Developers → API keys**
3. Create a key and copy the bearer token

## 2. Configure the gateway

### Option A: Admin dashboard (no redeploy)

Sign in as the platform administrator and open **Admin → Settings → Ziina
Payments**. Paste the API token and webhook secret, choose test or live mode,
and save. Credentials remain server-side; the browser only receives presence,
source, and the token's last four characters.

### Option B: Environment variables

Environment variables always take precedence over admin-saved values, which is
useful when production and staging need separate credentials.

```env
ZIINA_API_TOKEN=<bearer token>                 # from step 1
ZIINA_WEBHOOK_SECRET=<openssl rand -hex 32>    # you generate this
ZIINA_TEST_MODE=true                           # set to false for live charges
ZIINA_USD_TO_AED=3.6725                        # plan/card prices are stored in USD
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `ZIINA_API_TOKEN` | to go live | Bearer token for the Payment Intents API. **Without it every payment is simulated.** |
| `ZIINA_WEBHOOK_SECRET` | recommended | Shared secret used to verify the `X-Hmac-Signature` header on webhooks. |
| `ZIINA_TEST_MODE` | optional | `true` (default) creates *test* payment intents — no real money moves. Set `false` only when going live. |
| `ZIINA_USD_TO_AED` | optional | Conversion rate for USD catalogue prices. Defaults to `3.6725`. |
| `ZIINA_API_BASE` | optional | Overrides the API base URL (`https://api.ziina.com/api`) for testing against a stub. |

## 3. Register the webhook

In the Ziina dashboard (**Developers → Webhooks**), register:

```
https://YOUR-DOMAIN/api/billing/webhook
```

and set the secret to the same value as `ZIINA_WEBHOOK_SECRET`.

Every delivery is verified as a hex HMAC-SHA256 of the raw request body
(compared in constant time). Wrong or missing signatures get `401`.

## 4. How a payment flows

1. User picks a plan or places a card order → the API creates a Ziina
   **Payment Intent** (amount in **fils**, 1 AED = 100 fils; minimum charge
   2 AED) and returns the hosted checkout `redirect_url`.
2. The browser is redirected to Ziina (card / Apple Pay / Google Pay).
3. On completion the browser returns to `/api/billing/confirm`, which
   re-fetches the intent from Ziina (authoritative status) and **finalizes
   immediately** — no waiting on the webhook.
4. Ziina also fires the webhook → `/api/billing/webhook` re-confirms and
   fulfills through the same **idempotent** helper. Duplicate delivery is a
   no-op.
5. Every transaction is visible in **Admin → Payments**.

## 5. Going live checklist

- [ ] `ZIINA_API_TOKEN` set (production key)
- [ ] `ZIINA_TEST_MODE=false`
- [ ] Webhook registered for your production domain with the matching
      `ZIINA_WEBHOOK_SECRET`
- [ ] `NEXTAUTH_URL` set to the production origin (used to build the
      success/cancel/failure return URLs)
- [ ] Place one real payment and confirm it appears in **Admin → Payments**

## Test cards & amounts

With `ZIINA_TEST_MODE=true`, no real charges are made — use Ziina's test card
numbers from their dashboard. Amounts are always sent in fils
(e.g. AED 44.00 → `4400`).
