import { z } from "zod";

export const invoiceRequestSchema = z.object({
  order: z.object({
    id: z.string().min(1),
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    amountMinor: z.number().int().positive(),
    description: z.string().min(1),
  }),
  paymentEvents: z.array(z.object({
    id: z.string().min(1),
    type: z.enum(["authorized", "captured", "refunded", "disputed"]),
    occurredAt: z.string().datetime(),
  })).min(1),
  risk: z.object({ score: z.number().min(0).max(100) }),
});

export type InvoiceRequest = z.infer<typeof invoiceRequestSchema>;

export type InvoiceDecision =
  | { action: "generate_invoice"; notification: string }
  | { action: "manual_review"; notification: string };

export function decideInvoice(input: InvoiceRequest): InvoiceDecision {
  const captured = input.paymentEvents.some((event) => event.type === "captured");
  const reversed = input.paymentEvents.some(
    (event) => event.type === "refunded" || event.type === "disputed",
  );

  if (!captured || reversed || input.risk.score >= 70) {
    return {
      action: "manual_review",
      notification: `Invoice held for review: order=${input.order.id} risk=${input.risk.score}`,
    };
  }

  return {
    action: "generate_invoice",
    notification: `Invoice approved: order=${input.order.id} payment_events=${input.paymentEvents.length}`,
  };
}

export function renderInvoiceHtml(input: InvoiceRequest): string {
  const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
  const amount = new Intl.NumberFormat("en", {
    style: "currency",
    currency: input.order.currency,
  }).format(input.order.amountMinor / 100);

  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;padding:40px;color:#17212b}dt{font-weight:700}dd{margin:0 0 16px}</style></head><body><h1>Invoice</h1><dl><dt>Order</dt><dd>${escape(input.order.id)}</dd><dt>Customer</dt><dd>${escape(input.order.customerName)} (${escape(input.order.customerEmail)})</dd><dt>Description</dt><dd>${escape(input.order.description)}</dd><dt>Total</dt><dd>${escape(amount)}</dd></dl></body></html>`;
}
