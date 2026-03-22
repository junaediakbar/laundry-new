import 'server-only';

import crypto from 'crypto';

const cookieName = 'laundry_session';

type SessionPayload = {
  uid: string;
  email: string;
  role: string;
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET || '';
}

export function authCookieName() {
  return cookieName;
}

export function signSession(
  uid: string,
  email: string,
  role: string,
  ttlSeconds: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid, email, role, exp: now + ttlSeconds };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url',
  );
  const sig = crypto
    .createHmac('sha256', secret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySession(token: string | undefined | null) {
  const raw = (token ?? '').trim();
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = crypto
    .createHmac('sha256', secret())
    .update(encoded)
    .digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  const ok = crypto.timingSafeEqual(a, b);
  if (!ok) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as SessionPayload;
  } catch {
    return null;
  }
  if (
    !payload?.uid ||
    !payload?.email ||
    !payload?.role ||
    typeof payload.exp !== 'number'
  )
    return null;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;
  return payload;
}
