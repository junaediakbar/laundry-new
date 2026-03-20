-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "completed_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."order_attachments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_attachments_order_id_idx" ON "public"."order_attachments"("order_id");

-- AddForeignKey
ALTER TABLE "public"."order_attachments" ADD CONSTRAINT "order_attachments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
