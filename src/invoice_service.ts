import { createServer, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import { generateInvoicePdf, InfraiError } from "./infrai_pdf.js";
import { decideInvoice, invoiceRequestSchema, renderInvoiceHtml } from "./order_policy.js";

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/invoices") {
    json(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = invoiceRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const decision = decideInvoice(input);
    console.info(JSON.stringify({ kind: "audit_notification", message: decision.notification }));

    if (decision.action === "manual_review") {
      json(response, 202, { orderId: input.order.id, status: decision.action, notification: decision.notification });
      return;
    }

    const pdf = await generateInvoicePdf(renderInvoiceHtml(input), input.order.id);
    json(response, 201, { orderId: input.order.id, status: "invoice_generated", pdf });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      json(response, 400, { error: "Invalid invoice request", details: error instanceof ZodError ? error.issues : undefined });
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      json(response, status, { error: error.code, details: error.details });
      return;
    }
    console.error(error);
    json(response, 500, { error: "Invoice processing failed" });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Invoice service listening on http://localhost:${port}`));
