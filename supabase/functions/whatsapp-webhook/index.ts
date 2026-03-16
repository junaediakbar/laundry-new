// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { createAdminClient } from '../_shared/supabase.ts';
import { getRequiredEnv } from '../_shared/env.ts';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
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

serve(async (request) => {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const expected = getRequiredEnv('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === expected && challenge) {
      return new Response(challenge, { status: 200 });
    }

    return jsonResponse(403, { error: 'Verification failed' });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const supabase = createAdminClient();
  const payload = await readJson(request);

  if (!payload) {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  await supabase.from('whatsapp_webhook_logs').insert({
    payload_json: payload,
  });

  const statuses: Array<{ id?: string; status?: string }> = [];

  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value;
      const s = Array.isArray(value?.statuses) ? value.statuses : [];
      for (const item of s) {
        statuses.push({ id: item?.id, status: item?.status });
      }
    }
  }

  const statusMap: Record<string, string> = {
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
  };

  for (const s of statuses) {
    const messageId = typeof s.id === 'string' ? s.id : null;
    const status = typeof s.status === 'string' ? s.status : null;
    if (!messageId || !status) continue;

    const mapped = statusMap[status] ?? null;
    if (!mapped) continue;

    await supabase
      .from('whatsapp_message_logs')
      .update({
        send_status: mapped,
        meta_response_json: payload,
      })
      .eq('meta_message_id', messageId);
  }

  return jsonResponse(200, { ok: true });
});
