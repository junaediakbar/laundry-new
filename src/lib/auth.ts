import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { authCookieName, verifySession } from '@/lib/auth-session';

export async function requireAuth() {
  const token = cookies().get(authCookieName())?.value;
  const session = verifySession(token);
  if (!session) {
    redirect('/login');
  }
  return session;
}
