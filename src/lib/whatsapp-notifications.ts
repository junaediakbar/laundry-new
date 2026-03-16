import 'server-only';

export type WhatsAppEventKey =
  | 'invoice_created'
  | 'shipping_soon'
  | 'pickup_ready';

type TriggerWhatsAppInput = {
  orderId: string;
  eventKey: WhatsAppEventKey;
};

async function callSendOrderWhatsApp({
  orderId,
  eventKey,
  dryRun,
}: TriggerWhatsAppInput & { dryRun: boolean }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const internalToken = process.env.SUPABASE_FUNCTION_INTERNAL_TOKEN;

  if (!supabaseUrl || !internalToken) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_FUNCTION_INTERNAL_TOKEN',
    );
  }

  const url = `${supabaseUrl}/functions/v1/send-order-whatsapp`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': internalToken,
    },
    body: JSON.stringify({ orderId, eventKey, dryRun }),
    cache: 'no-store',
  });

  const text = await response.text();
  const json = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  })();

  if (!response.ok) {
    const message =
      typeof json === 'object' &&
      json !== null &&
      'error' in json &&
      typeof (json as { error?: unknown }).error === 'string'
        ? (json as { error: string }).error
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return json;
}

export async function triggerOrderWhatsAppNotification({
  orderId,
  eventKey,
}: TriggerWhatsAppInput) {
  const json = await callSendOrderWhatsApp({
    orderId,
    eventKey,
    dryRun: false,
  });
  return json as {
    ok: boolean;
    orderId: string;
    eventKey: WhatsAppEventKey;
    metaMessageId?: string | null;
  };
}

export async function previewOrderWhatsAppNotification({
  orderId,
  eventKey,
}: TriggerWhatsAppInput) {
  const json = await callSendOrderWhatsApp({ orderId, eventKey, dryRun: true });
  return json as {
    ok: true;
    dryRun: true;
    orderId: string;
    eventKey: WhatsAppEventKey;
    toPhone: { raw: string; e164: string };
    template: { name: string; languageCode: string };
    params: { body: string[] };
  };
}
