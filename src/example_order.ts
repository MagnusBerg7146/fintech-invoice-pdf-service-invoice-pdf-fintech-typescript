const response = await fetch("http://localhost:3000/invoices", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    order: {
      id: "ord_2026_0901",
      customerName: "Ada Chen",
      customerEmail: "ada@example.com",
      currency: "USD",
      amountMinor: 12900,
      description: "Treasury analytics subscription",
    },
    paymentEvents: [
      { id: "pay_evt_1", type: "authorized", occurredAt: "2026-09-01T08:00:00.000Z" },
      { id: "pay_evt_2", type: "captured", occurredAt: "2026-09-01T08:01:00.000Z" },
    ],
    risk: { score: 18 },
  }),
});

console.log(JSON.stringify(await response.json(), null, 2));

export {};
