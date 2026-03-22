import { NextResponse, type NextRequest } from 'next/server';

function base64urlToBytes(input: string) {
  const pad = '='.repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifySessionToken(token: string | undefined) {
  const raw = (token ?? '').trim();
  if (!raw) return false;
  const secret = process.env.AUTH_SECRET || '';
  if (!secret) return true;

  const parts = raw.split('.');
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    base64urlToBytes(sig),
    new TextEncoder().encode(encoded),
  );
  if (!ok) return false;

  let payload: { exp?: number } | null = null;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(encoded)));
  } catch {
    payload = null;
  }
  if (!payload || typeof payload.exp !== 'number') return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('laundry_session')?.value;
  const isLoggedIn = await verifySessionToken(token);

  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/customers') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/service-types') ||
    pathname.startsWith('/delivery-planning') ||
    pathname.startsWith('/employees') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/reports');

  if (!isLoggedIn && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: request.headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
