'use server';

import { backendFetch } from '@/lib/backend';
import { type SearchableOption } from '@/components/ui/searchable-select';

type CustomerSearchItem = {
  id: string;
  name: string;
  phone?: string | null;
};

type CustomersSearchResponse = {
  items: CustomerSearchItem[];
  total: number;
};

export async function searchCustomersAction(
  query: string,
): Promise<SearchableOption[]> {
  const result = await backendFetch<CustomersSearchResponse>(
    `/api/v1/customers?q=${encodeURIComponent(query ?? '')}`,
  ).catch(() => ({ items: [], total: 0 }));

  return result.items.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.phone ?? null,
  }));
}

