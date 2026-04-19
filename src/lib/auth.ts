import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { authCookieName, verifySession } from '@/lib/auth-session';

export async function getSession() {
  const token = cookies().get(authCookieName())?.value;
  return verifySession(token);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}
