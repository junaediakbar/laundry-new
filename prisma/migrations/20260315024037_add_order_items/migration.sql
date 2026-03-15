-- AlterTable
ALTER TABLE "public"."orders" ALTER COLUMN "service_type_id" DROP NOT NULL,
ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "unit_price" DROP NOT NULL,
ALTER COLUMN "discount" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "service_type_id" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

INSERT INTO "public"."order_items" (
    "id",
    "order_id",
    "service_type_id",
    "quantity",
    "unit_price",
    "discount",
    "total",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    "id",
    "service_type_id",
    "quantity",
    "unit_price",
    COALESCE("discount", 0),
    "total",
    "created_at",
    "updated_at"
FROM "public"."orders"
WHERE
    "service_type_id" IS NOT NULL
    AND "quantity" IS NOT NULL
    AND "unit_price" IS NOT NULL;

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "public"."order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_service_type_id_idx" ON "public"."order_items"("service_type_id");

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
