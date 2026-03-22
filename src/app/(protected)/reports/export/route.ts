import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const base = (
    process.env.BACKEND_BASE_URL || 'http://localhost:8080'
  ).replace(/\/$/, '');
  const qs = new URLSearchParams();
  if (startDate) qs.set('startDate', startDate);
  if (endDate) qs.set('endDate', endDate);
  const url = `${base}/api/v1/reports/orders.csv${qs.toString() ? `?${qs}` : ''}`;
  const token = cookies().get('backend_token')?.value;

  const res = await fetch(url, {
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  const body = await res.arrayBuffer();
  if (!res.ok) {
    return new NextResponse(body, { status: res.status });
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="report-${startDate ?? 'all'}-${endDate ?? 'all'}.csv"`,
    },
  });
}
