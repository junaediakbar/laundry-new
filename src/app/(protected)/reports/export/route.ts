import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(`${endDate}T23:59:59`) : undefined;

  const orders = await prisma.order.findMany({
    where:
      start || end
        ? {
            createdAt: {
              gte: start,
              lte: end,
            },
          }
        : undefined,
    include: { customer: true, items: { include: { serviceType: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const csvHeader =
    'invoice_number,tanggal,pelanggan,items,total,payment_status,workflow_status\n';
  const csvRows = orders
    .map(
      (order: {
        invoiceNumber: string;
        createdAt: Date;
        customer: { name: string };
        items: Array<{
          quantity: { toString(): string };
          serviceType: { name: string; unit: string };
          total: { toString(): string };
        }>;
        total: { toString(): string };
        paymentStatus: string;
        workflowStatus: string;
      }) => {
        const itemsText = order.items
          .map((item) => {
            const qty = Number(item.quantity.toString());
            const subTotal = Number(item.total.toString());
            return `${qty} ${item.serviceType.unit} ${item.serviceType.name} (${subTotal})`;
          })
          .join('; ');

        return [
          order.invoiceNumber,
          new Date(order.createdAt).toISOString(),
          `"${order.customer.name}"`,
          `"${itemsText.replaceAll('"', '""')}"`,
          Number(order.total.toString()),
          order.paymentStatus,
          order.workflowStatus,
        ].join(',');
      },
    )
    .join('\n');

  return new NextResponse(csvHeader + csvRows, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="report-${startDate ?? 'all'}-${endDate ?? 'all'}.csv"`,
    },
  });
}
