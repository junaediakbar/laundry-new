import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function pad3(value: number) {
  return `${value}`.padStart(3, '0');
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(items: T[]) {
  return items[randInt(0, items.length - 1)];
}

function formatDecimalCents(valueCents: number) {
  return (valueCents / 100).toFixed(2);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function randomPastDate(daysBackMax: number) {
  return addDays(new Date(), -randInt(0, daysBackMax));
}

async function main() {
  const serviceTypes = [
    { name: 'Cuci Kering', unit: 'kg', defaultPrice: 7000 },
    { name: 'Cuci Setrika', unit: 'kg', defaultPrice: 9000 },
    { name: 'Setrika Saja', unit: 'kg', defaultPrice: 6000 },
    { name: 'Express', unit: 'kg', defaultPrice: 12000 },
    { name: 'Bed Cover', unit: 'item', defaultPrice: 25000 },
  ];

  for (const serviceType of serviceTypes) {
    await prisma.serviceType.upsert({
      where: { name: serviceType.name },
      update: {
        unit: serviceType.unit,
        defaultPrice: serviceType.defaultPrice,
        isActive: true,
      },
      create: serviceType,
    });
  }

  const dummyEmailDomain = 'seed.local';

  await prisma.payment.deleteMany({
    where: {
      order: { customer: { email: { endsWith: `@${dummyEmailDomain}` } } },
    },
  });
  await prisma.order.deleteMany({
    where: { customer: { email: { endsWith: `@${dummyEmailDomain}` } } },
  });
  await prisma.customer.deleteMany({
    where: { email: { endsWith: `@${dummyEmailDomain}` } },
  });

  await prisma.user.upsert({
    where: { email: 'owner@seed.local' },
    update: { name: 'Owner Seed', role: 'owner' },
    create: {
      authUserId: 'seed-owner',
      name: 'Owner Seed',
      email: 'owner@seed.local',
      role: 'owner',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@seed.local' },
    update: { name: 'Admin Seed', role: 'admin' },
    create: {
      authUserId: 'seed-admin',
      name: 'Admin Seed',
      email: 'admin@seed.local',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'cashier@seed.local' },
    update: { name: 'Cashier Seed', role: 'cashier' },
    create: {
      authUserId: 'seed-cashier',
      name: 'Cashier Seed',
      email: 'cashier@seed.local',
      role: 'cashier',
    },
  });

  const activeServiceTypes = await prisma.serviceType.findMany({
    where: { isActive: true },
    select: { id: true, unit: true, defaultPrice: true },
  });

  if (activeServiceTypes.length === 0) {
    throw new Error('Service types belum tersedia untuk seeding.');
  }

  const customerCount = 500;
  const orderCount = 500;

  const customerEmails: string[] = [];
  const customerData = Array.from({ length: customerCount }).map((_, index) => {
    const seq = `${index + 1}`.padStart(4, '0');
    const email = `dummy-customer-${seq}@${dummyEmailDomain}`;
    customerEmails.push(email);

    const createdAt = randomPastDate(180);
    const phone = `08${`${index + 1}`.padStart(10, '0')}`;
    return {
      name: `Pelanggan ${seq}`,
      phone,
      address: `Jl. Contoh No. ${randInt(1, 250)}`,
      email,
      notes: index % 7 === 0 ? 'Pelanggan langganan' : null,
      createdAt,
    };
  });

  await prisma.customer.createMany({ data: customerData });

  const customers = await prisma.customer.findMany({
    where: { email: { in: customerEmails } },
    select: { id: true, email: true },
  });

  if (customers.length !== customerCount) {
    throw new Error(
      `Seed customers gagal: expected ${customerCount}, got ${customers.length}`,
    );
  }

  const now = new Date();
  const datePart = `${now.getFullYear()}${`${now.getMonth() + 1}`.padStart(2, '0')}${`${now.getDate()}`.padStart(2, '0')}`;
  const invoicePrefix = `LDR-${datePart}-`;
  const existingToday = await prisma.order.count({
    where: { invoiceNumber: { startsWith: invoicePrefix } },
  });

  const methods = ['cash', 'transfer', 'qris'];
  const workflowOptions: Array<
    'received' | 'washing' | 'drying' | 'ironing' | 'finished' | 'picked_up'
  > = ['received', 'washing', 'drying', 'ironing', 'finished', 'picked_up'];

  const invoices: string[] = [];
  const paymentPlanByInvoice = new Map<
    string,
    { payments: Array<{ amountCents: number; paidAt: Date; method: string }> }
  >();

  const orders: Array<{ id: string; invoiceNumber: string }> = [];

  for (let index = 0; index < orderCount; index++) {
    const customer = customers[index % customers.length];
    const receivedDate = randomPastDate(60);

    const workflowStatus = pickOne(workflowOptions);
    const pickupDate =
      workflowStatus === 'picked_up'
        ? addDays(receivedDate, randInt(1, 14))
        : null;

    const invoiceNumber = `${invoicePrefix}${pad3(existingToday + index + 1)}`;
    invoices.push(invoiceNumber);

    const lineCount = randInt(1, 4);
    const orderItems: Array<{
      serviceTypeId: string;
      quantity: string;
      unitPrice: string;
      discount: string;
      total: string;
      totalCents: number;
    }> = [];

    for (let i = 0; i < lineCount; i++) {
      const serviceType = pickOne(activeServiceTypes);
      const quantityHundredth =
        serviceType.unit === 'kg' ? randInt(2, 20) * 50 : randInt(1, 5) * 100;
      const unitPriceCents = Math.round(
        Number(serviceType.defaultPrice.toString()) * 100,
      );
      const subtotalCents = Math.round(
        (quantityHundredth * unitPriceCents) / 100,
      );
      const discountCents =
        randInt(1, 10) <= 2 ? pickOne([1000, 2000, 3000, 5000]) * 100 : 0;
      const safeDiscountCents = Math.min(
        discountCents,
        Math.max(subtotalCents - 100, 0),
      );
      const totalCents = Math.max(subtotalCents - safeDiscountCents, 0);

      orderItems.push({
        serviceTypeId: serviceType.id,
        quantity: formatDecimalCents(quantityHundredth),
        unitPrice: formatDecimalCents(unitPriceCents),
        discount: formatDecimalCents(safeDiscountCents),
        total: formatDecimalCents(totalCents),
        totalCents,
      });
    }

    const orderTotalCents = orderItems.reduce(
      (sum, item) => sum + item.totalCents,
      0,
    );

    const paymentRoll = randInt(1, 100);
    const payments: Array<{
      amountCents: number;
      paidAt: Date;
      method: string;
    }> = [];
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';

    if (orderTotalCents === 0) {
      paymentStatus = 'paid';
      payments.push({
        amountCents: 0,
        paidAt: addDays(receivedDate, randInt(0, 2)),
        method: pickOne(methods),
      });
    } else if (paymentRoll <= 15) {
      paymentStatus = 'unpaid';
    } else if (paymentRoll <= 40) {
      paymentStatus = 'partial';
      const minPay = Math.min(
        Math.max(Math.floor(orderTotalCents * 0.2), 100),
        orderTotalCents - 1,
      );
      const maxPay = Math.min(
        Math.max(Math.floor(orderTotalCents * 0.8), minPay),
        orderTotalCents - 1,
      );
      const amountCents = randInt(minPay, maxPay);
      payments.push({
        amountCents,
        paidAt: addDays(receivedDate, randInt(0, 5)),
        method: pickOne(methods),
      });
    } else {
      paymentStatus = 'paid';
      if (randInt(1, 100) <= 30) {
        const first = Math.min(
          Math.max(Math.floor((orderTotalCents * randInt(30, 70)) / 100), 1),
          orderTotalCents - 1,
        );
        const second = orderTotalCents - first;
        payments.push({
          amountCents: first,
          paidAt: addDays(receivedDate, randInt(0, 2)),
          method: pickOne(methods),
        });
        payments.push({
          amountCents: second,
          paidAt: addDays(receivedDate, randInt(1, 6)),
          method: pickOne(methods),
        });
      } else {
        payments.push({
          amountCents: orderTotalCents,
          paidAt: addDays(receivedDate, randInt(0, 5)),
          method: pickOne(methods),
        });
      }
    }

    paymentPlanByInvoice.set(invoiceNumber, { payments });

    const created = await prisma.order.create({
      data: {
        invoiceNumber,
        customerId: customer.id,
        total: formatDecimalCents(orderTotalCents),
        paymentStatus,
        workflowStatus,
        receivedDate,
        pickupDate,
        createdAt: receivedDate,
        note: randInt(1, 10) <= 2 ? 'Catatan dummy' : null,
        items: {
          create: orderItems.map((item) => ({
            serviceTypeId: item.serviceTypeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
            createdAt: receivedDate,
          })),
        },
      },
      select: { id: true, invoiceNumber: true },
    });

    orders.push(created);
  }

  const paymentData = orders.flatMap((order) => {
    const plan = paymentPlanByInvoice.get(order.invoiceNumber);
    if (!plan || plan.payments.length === 0) {
      return [];
    }
    return plan.payments.map((p) => ({
      orderId: order.id,
      amount: formatDecimalCents(p.amountCents),
      method: p.method,
      paidAt: p.paidAt,
      note: randInt(1, 10) <= 2 ? 'Pembayaran dummy' : null,
      createdAt: p.paidAt,
    }));
  });

  if (paymentData.length > 0) {
    await prisma.payment.createMany({ data: paymentData });
  }

  console.log(
    JSON.stringify(
      {
        seeded: {
          customers: customerCount,
          orders: orderCount,
          payments: paymentData.length,
          serviceTypes: activeServiceTypes.length,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
