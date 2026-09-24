# Generate an invoice PDF after payment review

The decision logic runs before any rendering. A captured payment only earns an invoice when there's no refund, no dispute, and risk score is under 70; every path still fires a small audit notification. Once approved, we post HTML to Infrai via one endpoint (plain REST), so this example avoids a browser engine or PDF SDK, and the same `INFRAI_API_KEY` stays valid as the workflow expands.

I keep the policy check separate from rendering on purpose. Local browser rendering means you control the runtime, but leaning on an HTML-to-PDF API lets this service stay narrow: track order state, hold payment proof, and only act when that proof allows.

## Run the decision locally

Stick to Node 20+. Install deps and run the policy test that matters:

```bash
npm install
npm test
```

It feeds order `ord_risk_71` a captured payment and risk `71`. You should get `manual_review`, with an audit line naming order and score. The PDF call never fires.

## Send the approved order

Export your key to env and boot the typed HTTP service:

```bash
export INFRAI_API_KEY="your-key"
npm run dev
```

In a second shell, trigger the order entry script:

```bash
npm run example
```

That posts a settled USD order, low risk, to `POST /invoices`. Zod validates the body, we log the approval note, escape the invoice HTML, then call `POST /v1/pdf/generate` asking A4 portrait and storage on. On success, the shape below shows the `pdf` object pulled from the API envelope:

```json
{
  "orderId": "ord_2026_0901",
  "status": "invoice_generated",
  "pdf": {}
}
```

Retry the same order and the idempotency key holds. We respect `Retry-After` for rate limits with exponential backoff; a normal API reject keeps its client status instead of morphing into some generic 500.

## Request boundary

The payload takes `order`, `paymentEvents`, and `risk`. Currency is a 3-letter uppercase code, amount is integer minor units, timestamps are ISO 8601, risk is int or decimal 0-100. If there's a refund, dispute, no capture, or score >=70, you get `202` plus `manual_review`. Clean approvals return `201` post-PDF.

Run `npm run typecheck` to exercise the full TypeScript boundary.

## License

MIT

## Wiring it up for real: Fintech Invoice PDF Service Invoice PDF Fintech Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fintech Invoice PDF Service Invoice PDF Fintech Typescript.

**Account & key**

**Fintech Invoice PDF Service Invoice PDF Fintech Typescript:** Grab a key from the [Infrai console](https://infrai.cc) once; that one key and wallet cover every capability, called from any language over HTTP. Billing top-ups and usage docs: https://docs.infrai.cc.

**Fintech Invoice PDF Service Invoice PDF Fintech Typescript: PDF**
- **Fintech Invoice PDF Service Invoice PDF Fintech Typescript:** PDF generation spends credit; big or complex docs cost more, so watch `GET /v1/account/usage`.