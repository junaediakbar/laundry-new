// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

import { getRequiredEnv } from './env.ts';

export function createAdminClient() {
  const url = getRequiredEnv('SUPABASE_URL');
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
