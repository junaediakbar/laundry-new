-- CreateEnum
CREATE TYPE "public"."WorkTaskType" AS ENUM ('pickup', 'dropoff', 'fuel_vehicle', 'driver', 'dust_removal', 'brushing', 'rinse_sprayer', 'spin_dry', 'finishing_packing');

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_assignments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "task_type" "public"."WorkTaskType" NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employees_name_idx" ON "public"."employees"("name");

-- CreateIndex
CREATE INDEX "work_assignments_order_id_idx" ON "public"."work_assignments"("order_id");

-- CreateIndex
CREATE INDEX "work_assignments_employee_id_idx" ON "public"."work_assignments"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_assignments_order_item_id_task_type_key" ON "public"."work_assignments"("order_item_id", "task_type");

-- AddForeignKey
ALTER TABLE "public"."work_assignments" ADD CONSTRAINT "work_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_assignments" ADD CONSTRAINT "work_assignments_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_assignments" ADD CONSTRAINT "work_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
