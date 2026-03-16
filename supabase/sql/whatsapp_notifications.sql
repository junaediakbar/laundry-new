-- Tables for WhatsApp transactional notifications (Meta Cloud API)
-- Apply in Supabase SQL editor.

create table if not exists public.whatsapp_templates_map (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  template_name text not null,
  language_code text not null default 'en',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists whatsapp_templates_map_event_key_active_uniq
  on public.whatsapp_templates_map (event_key)
  where is_active;

create table if not exists public.whatsapp_message_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid null,
  customer_phone text not null,
  event_key text not null,
  template_name text not null,
  template_params_json jsonb not null default '{}'::jsonb,
  meta_message_id text null,
  send_status text not null default 'queued',
  meta_response_json jsonb null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_message_logs_order_id_idx
  on public.whatsapp_message_logs (order_id);

create index if not exists whatsapp_message_logs_event_key_idx
  on public.whatsapp_message_logs (event_key);

create index if not exists whatsapp_message_logs_customer_phone_idx
  on public.whatsapp_message_logs (customer_phone);

create unique index if not exists whatsapp_message_logs_meta_message_id_uniq
  on public.whatsapp_message_logs (meta_message_id)
  where meta_message_id is not null;

create table if not exists public.whatsapp_webhook_logs (
  id uuid primary key default gen_random_uuid(),
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_webhook_logs_created_at_idx
  on public.whatsapp_webhook_logs (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists whatsapp_templates_map_set_updated_at on public.whatsapp_templates_map;
create trigger whatsapp_templates_map_set_updated_at
before update on public.whatsapp_templates_map
for each row execute function public.set_updated_at();

drop trigger if exists whatsapp_message_logs_set_updated_at on public.whatsapp_message_logs;
create trigger whatsapp_message_logs_set_updated_at
before update on public.whatsapp_message_logs
for each row execute function public.set_updated_at();

alter table public.whatsapp_templates_map enable row level security;
alter table public.whatsapp_message_logs enable row level security;
alter table public.whatsapp_webhook_logs enable row level security;

-- RLS recommendations:
-- 1) Frontend should NOT read or write message logs by default (contains PII + Meta response).
-- 2) Frontend may read templates map if you want a UI to manage mappings,
--    but safest is to restrict it to admins only and only via server/admin tooling.
--
-- Default: no policies (deny all). Use service role in Edge Functions for all writes/reads.
