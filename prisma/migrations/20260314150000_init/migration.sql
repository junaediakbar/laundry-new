CREATE TYPE "Role" AS ENUM ('owner', 'admin', 'cashier');
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'partial', 'paid');
CREATE TYPE "WorkflowStatus" AS ENUM ('received', 'washing', 'drying', 'ironing', 'finished', 'picked_up');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "auth_user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_types" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "default_price" DECIMAL(12,2) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "service_type_id" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "unit_price" DECIMAL(12,2) NOT NULL,
  "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL,
  "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
  "workflow_status" "WorkflowStatus" NOT NULL DEFAULT 'received',
  "received_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pickup_date" TIMESTAMP(3),
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" TEXT NOT NULL,
  "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "customers_name_idx" ON "customers"("name");
CREATE UNIQUE INDEX "service_types_name_key" ON "service_types"("name");
CREATE UNIQUE INDEX "orders_invoice_number_key" ON "orders"("invoice_number");
CREATE INDEX "orders_invoice_number_idx" ON "orders"("invoice_number");
CREATE INDEX "orders_payment_status_workflow_status_idx" ON "orders"("payment_status", "workflow_status");
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_service_type_id_fkey"
FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments"
ADD CONSTRAINT "payments_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
