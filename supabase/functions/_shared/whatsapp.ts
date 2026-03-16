// @ts-nocheck
import { getRequiredEnv } from './env.ts';

type WhatsAppTemplateComponent = {
  type: 'body';
  parameters: Array<{ type: 'text'; text: string }>;
};

export type SendTemplateMessageInput = {
  toPhoneE164: string;
  templateName: string;
  languageCode: string;
  bodyParams: string[];
};

export async function sendWhatsAppTemplateMessage(
  input: SendTemplateMessageInput,
) {
  const accessToken = getRequiredEnv('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = getRequiredEnv('WHATSAPP_PHONE_NUMBER_ID');

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const components: WhatsAppTemplateComponent[] = input.bodyParams.length
    ? [
        {
          type: 'body',
          parameters: input.bodyParams.map((text) => ({ type: 'text', text })),
        },
      ]
    : [];

  const payload = {
    messaging_product: 'whatsapp',
    to: input.toPhoneE164,
    type: 'template',
    template: {
      name: input.templateName,
      language: { code: input.languageCode },
      ...(components.length ? { components } : {}),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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
      typeof json?.error?.message === 'string'
        ? json.error.message
        : `HTTP ${response.status}`;
    const error = new Error(message);
    (error as any).meta = json;
    throw error;
  }

  const metaMessageId =
    typeof json?.messages?.[0]?.id === 'string'
      ? (json.messages[0].id as string)
      : null;

  return { metaMessageId, metaResponse: json };
}
