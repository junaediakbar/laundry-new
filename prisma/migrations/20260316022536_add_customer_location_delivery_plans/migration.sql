-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "longitude" DECIMAL(9,6);

-- CreateTable
CREATE TABLE "public"."delivery_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planned_date" TIMESTAMP(3) NOT NULL,
    "start_address" TEXT,
    "start_lat" DECIMAL(9,6),
    "start_lng" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."delivery_stops" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "distance_km" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_plans_planned_date_idx" ON "public"."delivery_plans"("planned_date");

-- CreateIndex
CREATE INDEX "delivery_stops_customer_id_idx" ON "public"."delivery_stops"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_stops_plan_id_customer_id_key" ON "public"."delivery_stops"("plan_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_stops_plan_id_sequence_key" ON "public"."delivery_stops"("plan_id", "sequence");

-- AddForeignKey
ALTER TABLE "public"."delivery_stops" ADD CONSTRAINT "delivery_stops_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."delivery_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_stops" ADD CONSTRAINT "delivery_stops_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
