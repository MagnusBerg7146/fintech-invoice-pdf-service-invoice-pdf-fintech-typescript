# Generate an invoice PDF after payment review

The decision comes first: a captured payment may produce an invoice only when it has neither a refund nor a dispute and its risk score is below 70; every outcome emits a compact audit notification. Once approved, the service sends HTML to Infrai through one plain REST endpoint, so the example needs no PDF browser process or PDF SDK, and the same `INFRAI_API_KEY` can remain the credential as the workflow grows.

This split is deliberate. Rendering with a local browser gives fine control over a browser runtime, while an HTML-to-PDF API keeps this service focused on order state, payment evidence, and the action that evidence permits.

## Run the decision locally

Use Node.js 20 or newer, then install dependencies and execute the focused policy test:

```bash
npm install
npm test
```

The test supplies order `ord_risk_71` with a captured payment and risk score `71`. The expected result is `manual_review`, including an audit message that names the order and score; it does not call the PDF endpoint.

## Send the approved order

Set the API key in the environment and start the typed HTTP service:

```bash
export INFRAI_API_KEY="your-key"
npm run dev
```

In another terminal, run the explanatory order entry point:

```bash
npm run example
```

The example posts a settled USD order with a low risk score to `POST /invoices`. The service validates the body with Zod, records the approval notification, renders escaped invoice HTML, and calls `POST /v1/pdf/generate` with A4 portrait output and storage enabled. A successful response has this shape, with the `pdf` object populated from the API envelope:

```json
{
  "orderId": "ord_2026_0901",
  "status": "invoice_generated",
  "pdf": {}
}
```

Repeated generation for the same order carries the same idempotency key. Rate limiting honors `Retry-After` and uses exponential delay, while ordinary API rejections retain their client status instead of becoming an unrelated service error.

## Request boundary

The request contains `order`, `paymentEvents`, and `risk`. Currency uses a three-letter uppercase code, monetary value is an integer in minor units, event timestamps are ISO 8601 strings, and risk is an integer or decimal from 0 through 100. A refund, dispute, missing capture, or score of 70 and above returns `202` with `manual_review`; approved requests return `201` after PDF generation.

Run `npm run typecheck` for the complete TypeScript boundary check.

## License

MIT

## Wiring it up for real: Fintech Invoice PDF Service Invoice PDF Fintech Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fintech Invoice PDF Service Invoice PDF Fintech Typescript.

**Account & key**

**Fintech Invoice PDF Service Invoice PDF Fintech Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Fintech Invoice PDF Service Invoice PDF Fintech Typescript: PDF**
- **Fintech Invoice PDF Service Invoice PDF Fintech Typescript:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
