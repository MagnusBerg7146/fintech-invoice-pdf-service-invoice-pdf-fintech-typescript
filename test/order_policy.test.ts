import assert from "node:assert/strict";
import test from "node:test";
import { decideInvoice, invoiceRequestSchema } from "../src/order_policy.js";

test("a captured high-risk order is held for review", () => {
  const input = invoiceRequestSchema.parse({
    order: {
      id: "ord_risk_71",
      customerName: "Rina Patel",
      customerEmail: "rina@example.com",
      currency: "USD",
      amountMinor: 8800,
      description: "Account funding report",
    },
    paymentEvents: [
      { id: "evt_capture", type: "captured", occurredAt: "2026-09-01T10:00:00.000Z" },
    ],
    risk: { score: 71 },
  });

  assert.deepEqual(decideInvoice(input), {
    action: "manual_review",
    notification: "Invoice held for review: order=ord_risk_71 risk=71",
  });
});
