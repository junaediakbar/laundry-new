import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';

loadEnvConfig(process.cwd());

function normalizeDatabaseUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const hostname = url.hostname.toLowerCase();
  const isLikelyPooler =
    hostname.includes('pooler') ||
    url.port === '6543' ||
    url.searchParams.get('pgbouncer') === 'true';
  if (!isLikelyPooler) {
    return rawUrl;
  }

  if (!url.searchParams.has('pgbouncer')) {
    url.searchParams.set('pgbouncer', 'true');
  }
  if (!url.searchParams.has('statement_cache_size')) {
    url.searchParams.set('statement_cache_size', '0');
  }
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '1');
  }

  return url.toString();
}

const databaseUrlRaw = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '';
if (!databaseUrlRaw) {
  throw new Error('DATABASE_URL / DIRECT_URL belum diisi.');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: normalizeDatabaseUrl(databaseUrlRaw),
    },
  },
});

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
    { name: 'Karpet Malaysia Tipis', unit: 'm2', defaultPrice: 20000 },
    { name: 'Karpet Malaysia Tebal', unit: 'm2', defaultPrice: 25000 },
    { name: 'Karpet Permadani Tipis', unit: 'm2', defaultPrice: 15000 },
    { name: 'Karpet Permadani Tebal', unit: 'm2', defaultPrice: 18000 },
    { name: 'Kasur Karakter Tipis', unit: 'm2', defaultPrice: 25000 },
    { name: 'Kasur Karakter Tebal', unit: 'm2', defaultPrice: 30000 },
    { name: 'Kasur Bulu Tipis', unit: 'm2', defaultPrice: 25000 },
    { name: 'Kasur Bulu Tebal', unit: 'm2', defaultPrice: 30000 },
    { name: 'Kasur Bulu Super Tebal', unit: 'm2', defaultPrice: 35000 },
    { name: 'Karpet Rol Polos Tipis', unit: 'm2', defaultPrice: 12000 },
    { name: 'Karpet Rol Tebal/ blk anyam', unit: 'm2', defaultPrice: 15000 },
    { name: 'Karpet Masjid Tipis', unit: 'm2', defaultPrice: 18000 },
    { name: 'Karpet Masjid Tebal', unit: 'm2', defaultPrice: 22000 },
    { name: 'Karpet Masjid Super Tebal', unit: 'm2', defaultPrice: 30000 },
    { name: 'Karpet Turki Tipis', unit: 'm2', defaultPrice: 20000 },
    { name: 'Karpet Turki Tebal', unit: 'm2', defaultPrice: 25000 },
    { name: 'Karpet Bulu Tipis', unit: 'm2', defaultPrice: 17000 },
    { name: 'Karpet Bulu Tebal', unit: 'm2', defaultPrice: 20000 },
    { name: 'Ambal', unit: 'm2', defaultPrice: 10000 },
    { name: 'Rumbai diputihkan/ dibersihkan', unit: 'm1', defaultPrice: 2000 },
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

  const prismaEmployee = prisma as unknown as {
    employee: {
      count(args?: unknown): Promise<number>;
      createMany(args: unknown): Promise<unknown>;
      findMany(args: unknown): Promise<Array<{ id: string; name: string }>>;
    };
  };

  const employeeCount = await prismaEmployee.employee.count();
  if (employeeCount === 0) {
    await prismaEmployee.employee.createMany({
      data: [
        { name: 'Driver A', isActive: true },
        { name: 'Driver B', isActive: true },
        { name: 'Operator 1', isActive: true },
        { name: 'Operator 2', isActive: true },
        { name: 'Operator 3', isActive: true },
        { name: 'Packing 1', isActive: true },
      ],
    });
  }

  const employees = await prismaEmployee.employee.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const driverEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes('driver'),
  );
  const packingEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes('packing'),
  );
  const operatorEmployees = employees.filter(
    (e) => !driverEmployees.some((d) => d.id === e.id),
  );

  const activeServiceTypes = await prisma.serviceType.findMany({
    where: { isActive: true },
    select: { id: true, unit: true, defaultPrice: true },
  });

  if (activeServiceTypes.length === 0) {
    throw new Error('Service types belum tersedia untuk seeding.');
  }

  const customerCount = Math.max(
    1,
    Number(process.env.SEED_CUSTOMER_COUNT ?? 500) || 500,
  );
  const orderCount = Math.max(
    1,
    Number(process.env.SEED_ORDER_COUNT ?? 500) || 500,
  );

  const paluLocations = [
    { name: 'Palu Barat - Lere', address: 'Kel. Lere, Kec. Palu Barat, Kota Palu', lat: -0.8929, lng: 119.8554 },
    { name: 'Palu Barat - Siranindi', address: 'Kel. Siranindi, Kec. Palu Barat, Kota Palu', lat: -0.8873, lng: 119.8497 },
    { name: 'Palu Timur - Talise', address: 'Kel. Talise, Kec. Mantikulore, Kota Palu', lat: -0.8773, lng: 119.8891 },
    { name: 'Palu Timur - Besusu', address: 'Kel. Besusu Tengah, Kec. Palu Timur, Kota Palu', lat: -0.9037, lng: 119.8686 },
    { name: 'Palu Selatan - Birobuli', address: 'Kel. Birobuli Utara, Kec. Palu Selatan, Kota Palu', lat: -0.9182, lng: 119.8852 },
    { name: 'Palu Selatan - Petobo', address: 'Kel. Petobo, Kec. Palu Selatan, Kota Palu', lat: -0.9462, lng: 119.8492 },
    { name: 'Mantikulore - Tondo', address: 'Kel. Tondo, Kec. Mantikulore, Kota Palu', lat: -0.8359, lng: 119.8999 },
    { name: 'Tatanga - Duyu', address: 'Kel. Duyu, Kec. Tatanga, Kota Palu', lat: -0.9308, lng: 119.8738 },
    { name: 'Ulujadi - Silae', address: 'Kel. Silae, Kec. Ulujadi, Kota Palu', lat: -0.8722, lng: 119.8408 },
    { name: 'Palu Utara - Mamboro', address: 'Kel. Mamboro Barat, Kec. Palu Utara, Kota Palu', lat: -0.8022, lng: 119.8459 },
  ];

  const customerEmails: string[] = [];
  const customerData = Array.from({ length: customerCount }).map((_, index) => {
    const seq = `${index + 1}`.padStart(4, '0');
    const email = `dummy-customer-${seq}@${dummyEmailDomain}`;
    customerEmails.push(email);

    const createdAt = randomPastDate(180);
    const phone = `08${`${index + 1}`.padStart(10, '0')}`;
    const palu = index < paluLocations.length ? paluLocations[index] : null;
    return {
      name: palu ? `${palu.name} (${seq})` : `Pelanggan ${seq}`,
      phone,
      address: palu ? palu.address : `Jl. Contoh No. ${randInt(1, 250)}`,
      latitude: palu ? palu.lat : null,
      longitude: palu ? palu.lng : null,
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

  const pickupTasks: Array<{ taskType: string; percent: number }> = [
    { taskType: 'pickup', percent: 5 },
    { taskType: 'dropoff', percent: 5 },
    { taskType: 'fuel_vehicle', percent: 5 },
    { taskType: 'driver', percent: 5 },
  ];

  const workTasks: Array<{ taskType: string; percent: number }> = [
    { taskType: 'dust_removal', percent: 5 },
    { taskType: 'brushing', percent: 5 },
    { taskType: 'rinse_sprayer', percent: 5 },
    { taskType: 'spin_dry', percent: 5 },
    { taskType: 'finishing_packing', percent: 10 },
  ];

  const invoices: string[] = [];
  const paymentPlanByInvoice = new Map<
    string,
    { payments: Array<{ amountCents: number; paidAt: Date; method: string }> }
  >();

  const prismaWork = prisma as unknown as {
    workAssignment: {
      createMany(args: unknown): Promise<unknown>;
    };
  };

  const orders: Array<{ id: string; invoiceNumber: string }> = [];
  let workAssignmentCreated = 0;

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
      select: {
        id: true,
        invoiceNumber: true,
        items: { select: { id: true, total: true } },
      },
    });

    orders.push({ id: created.id, invoiceNumber: created.invoiceNumber });

    if (employees.length > 0) {
      const roll = randInt(1, 100);
      const assignPickup = roll <= 85;
      const assignWork = roll <= 70 || (roll > 85 && roll <= 95);

      const assignmentData: Array<{
        orderId: string;
        orderItemId: string;
        employeeId: string;
        taskType: string;
        percent: string;
        amount: string;
      }> = [];

      for (const item of created.items) {
        const itemTotal = Number(item.total.toString());

        const tasks = [
          ...(assignPickup ? pickupTasks : []),
          ...(assignWork ? workTasks : []),
        ];

        for (const task of tasks) {
          const pool =
            task.taskType === 'finishing_packing'
              ? packingEmployees
              : task.taskType === 'driver'
                ? driverEmployees
                : operatorEmployees;

          const employee = pickOne(pool.length > 0 ? pool : employees);
          const amount = Math.max((itemTotal * task.percent) / 100, 0);
          assignmentData.push({
            orderId: created.id,
            orderItemId: item.id,
            employeeId: employee.id,
            taskType: task.taskType,
            percent: task.percent.toFixed(2),
            amount: amount.toFixed(2),
          });
        }
      }

      if (assignmentData.length > 0) {
        await prismaWork.workAssignment.createMany({ data: assignmentData });
        workAssignmentCreated += assignmentData.length;
      }
    }
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
          workAssignments: workAssignmentCreated,
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
