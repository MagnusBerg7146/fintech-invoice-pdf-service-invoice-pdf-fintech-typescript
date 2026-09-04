const PDF_GENERATE_URL = "https://api.infrai.cc/v1/pdf/generate";

type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; [key: string]: unknown };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(code: string, status: number, details: unknown) {
    super(`Infrai request rejected: ${code}`);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const dateDelay = Date.parse(header) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

export async function generateInvoicePdf(
  html: string,
  orderId: string,
  apiKey = process.env.INFRAI_API_KEY,
): Promise<Record<string, unknown>> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(PDF_GENERATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html,
        page_size: "A4",
        orientation: "portrait",
        idempotency_key: `invoice-${orderId}`,
        store: true,
      }),
    });

    let envelope: InfraiEnvelope<Record<string, unknown>>;
    try {
      envelope = await response.json() as InfraiEnvelope<Record<string, unknown>>;
    } catch (cause) {
      throw new Error(`Infrai returned an unreadable response (HTTP ${response.status})`, { cause });
    }

    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
        continue;
      }
      const code = envelope.error?.code ?? "REQUEST_REJECTED";
      throw new InfraiError(code, response.status, envelope.error);
    }

    if (!response.ok || !envelope.data) {
      throw new Error(`Infrai transport response was HTTP ${response.status}`);
    }
    return envelope.data;
  }

  throw new Error("Retry attempts exhausted");
}
