// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { createAdminClient } from '../_shared/supabase.ts';
import { getRequiredEnv } from '../_shared/env.ts';
import { sendWhatsAppTemplateMessage } from '../_shared/whatsapp.ts';

type EventKey = 'invoice_created' | 'shipping_soon' | 'pickup_ready';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function normalizePhoneToE164(raw: string) {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');

  if (digits.startsWith('+')) {
    return digits;
  }

  if (digits.startsWith('62')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+62${digits.slice(1)}`;
  }

  return `+${digits}`;
}

async function readJson(request: Request) {
  const text = await request.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const internalToken = request.headers.get('x-internal-token') ?? '';
  const expectedToken = getRequiredEnv('FUNCTION_INTERNAL_TOKEN');
  if (!internalToken || internalToken !== expectedToken) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }

  const body = await readJson(request);
  const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
  const eventKey = typeof body?.eventKey === 'string' ? body.eventKey : '';
  const dryRun = body?.dryRun === true;

  const allowedEvents: EventKey[] = [
    'invoice_created',
    'shipping_soon',
    'pickup_ready',
  ];
  if (!isUuid(orderId) || !allowedEvents.includes(eventKey as EventKey)) {
    return jsonResponse(400, { error: 'Invalid body' });
  }

  const supabase = createAdminClient();

  const { data: templateMap, error: templateError } = await supabase
    .from('whatsapp_templates_map')
    .select('event_key, template_name, language_code')
    .eq('event_key', eventKey)
    .eq('is_active', true)
    .maybeSingle();

  if (templateError) {
    return jsonResponse(500, { error: 'Failed to load template mapping' });
  }

  if (!templateMap?.template_name || !templateMap?.language_code) {
    return jsonResponse(404, { error: 'No active template mapping' });
  }

  const fetchFromExistingSchema = async () => {
    const result = await supabase
      .from('orders')
      .select(
        'id, invoice_number, total, workflow_status, created_at, pickup_date, customers:customer_id(name, phone)',
      )
      .eq('id', orderId)
      .maybeSingle();

    if (result.error) {
      return { data: null as null, error: result.error };
    }

    if (!result.data) return { data: null as null, error: null };

    const customer = Array.isArray((result.data as any).customers)
      ? (result.data as any).customers[0]
      : (result.data as any).customers;

    return {
      data: {
        id: result.data.id as string,
        customer_name: (customer?.name as string) ?? null,
        customer_phone: (customer?.phone as string) ?? null,
        order_status: (result.data as any).workflow_status ?? null,
        invoice_number: (result.data as any).invoice_number ?? null,
        total_amount: (result.data as any).total ?? null,
        pickup_code: null,
        created_at: (result.data as any).created_at ?? null,
      },
      error: null,
    };
  };

  const fetchFromRequestedSchema = async () => {
    return await supabase
      .from('orders')
      .select(
        'id, customer_name, customer_phone, order_status, invoice_number, total_amount, pickup_code, created_at',
      )
      .eq('id', orderId)
      .maybeSingle();
  };

  const orderFromExisting = await fetchFromExistingSchema();
  const orderResult =
    orderFromExisting.data || !orderFromExisting.error
      ? orderFromExisting
      : (() => {
          return { data: null as any, error: orderFromExisting.error };
        })();

  const order =
    orderResult.data ??
    (await (async () => {
      const r = await fetchFromRequestedSchema();
      return r.data;
    })());

  if (!order) {
    return jsonResponse(404, { error: 'Order not found' });
  }

  const customerPhone =
    typeof (order as any).customer_phone === 'string'
      ? (order as any).customer_phone
      : '';
  if (!customerPhone) {
    return jsonResponse(400, { error: 'Order customer_phone is missing' });
  }

  const toPhoneE164 = normalizePhoneToE164(customerPhone);

  const invoiceNumber = (order as any).invoice_number
    ? String((order as any).invoice_number)
    : '-';
  const customerName = (order as any).customer_name
    ? String((order as any).customer_name)
    : 'Pelanggan';
  const totalAmount =
    (order as any).total_amount != null
      ? String((order as any).total_amount)
      : '';
  const pickupCode = (order as any).pickup_code
    ? String((order as any).pickup_code)
    : '';

  const appPublicUrl = getRequiredEnv('APP_PUBLIC_URL');

  const templateParamsByEvent: Record<EventKey, string[]> = {
    invoice_created: [
      customerName,
      invoiceNumber,
      totalAmount,
      `${appPublicUrl}/orders/${orderId}`,
    ],
    shipping_soon: [
      customerName,
      invoiceNumber,
      `${appPublicUrl}/orders/${orderId}`,
    ],
    pickup_ready: [
      customerName,
      invoiceNumber,
      pickupCode || '-',
      `${appPublicUrl}/orders/${orderId}`,
    ],
  };

  const bodyParams = templateParamsByEvent[eventKey as EventKey];

  if (dryRun) {
    return jsonResponse(200, {
      ok: true,
      dryRun: true,
      orderId,
      eventKey,
      toPhone: { raw: customerPhone, e164: toPhoneE164 },
      template: { name: templateMap.template_name, languageCode: templateMap.language_code },
      params: { body: bodyParams },
    });
  }

  const logInsert = {
    order_id: orderId,
    customer_phone: customerPhone,
    event_key: eventKey,
    template_name: templateMap.template_name,
    template_params_json: { body: bodyParams },
    send_status: 'attempting',
  };

  const { data: logRow } = await supabase
    .from('whatsapp_message_logs')
    .insert(logInsert)
    .select('id')
    .single();

  try {
    const { metaMessageId, metaResponse } = await sendWhatsAppTemplateMessage({
      toPhoneE164,
      templateName: templateMap.template_name,
      languageCode: templateMap.language_code,
      bodyParams,
    });

    if (logRow?.id) {
      await supabase
        .from('whatsapp_message_logs')
        .update({
          meta_message_id: metaMessageId,
          send_status: 'sent',
          meta_response_json: metaResponse,
          error_message: null,
        })
        .eq('id', logRow.id);
    }

    return jsonResponse(200, {
      ok: true,
      orderId,
      eventKey,
      metaMessageId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const meta = (error as any)?.meta ?? null;

    if (logRow?.id) {
      await supabase
        .from('whatsapp_message_logs')
        .update({
          send_status: 'failed',
          meta_response_json: meta,
          error_message: message,
        })
        .eq('id', logRow.id);
    }

    return jsonResponse(502, { ok: false, error: 'Meta API error', message });
  }
});
