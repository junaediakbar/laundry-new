'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { authCookieName, signSession } from '@/lib/auth-session';
import { loginSchema } from '@/lib/validations';

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    redirect('/login?error=Input%20tidak%20valid');
  }

  const base = (process.env.BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
  const authSecret = process.env.AUTH_SECRET || '';

  if (!base || !authSecret) {
    redirect('/login?error=Konfigurasi%20AUTH%20belum%20diset');
  }

  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
    cache: 'no-store',
  }).catch(() => null);

  const json = (await res?.json().catch(() => null)) as
    | {
        ok: true;
        data: {
          token: string;
          user: { id: string; email: string; role: string; employeeId?: string };
        };
      }
    | { ok: false; error: { message?: string } }
    | null;

  if (!res || !res.ok || !json || !('ok' in json) || json.ok !== true) {
    const msg = (json && 'error' in json && json.error?.message) || 'Email atau password salah';
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  const backendToken = json.data.token;
  const user = json.data.user;

  cookies().set('backend_token', backendToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  const token = signSession(
    user.id,
    user.email,
    user.role,
    60 * 60 * 24 * 7,
    user.employeeId,
  );
  cookies().set(authCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  redirect('/dashboard');
}

export async function signOutAction() {
  cookies().set(authCookieName(), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  cookies().set('backend_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  redirect('/login');
}
