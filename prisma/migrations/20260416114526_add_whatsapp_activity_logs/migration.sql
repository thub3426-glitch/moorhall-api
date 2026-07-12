-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_STATUS_CHANGED', 'WHATSAPP_SEND_ATTEMPT', 'WHATSAPP_SENT', 'WHATSAPP_FAILED', 'RECEIPT_GENERATED', 'RECEIPT_SENT', 'ADMIN_ACTION');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CUSTOM_MESSAGE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SendStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "SendStatus" ADD VALUE 'READ';

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "providerMessageId" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "type" "ActivityType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "message" TEXT NOT NULL,
    "status" TEXT,
    "metadata" JSONB,
    "adminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppWebhookEvent" (
    "id" SERIAL NOT NULL,
    "providerEventId" TEXT,
    "messageType" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT,
    "messageId" TEXT,
    "status" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "rawPayload" JSONB,
    "notificationLogId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "notificationLogId" INTEGER,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_type_idx" ON "ActivityLog"("type");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");

-- CreateIndex
CREATE INDEX "ActivityLog_entityId_idx" ON "ActivityLog"("entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppWebhookEvent_messageId_idx" ON "WhatsAppWebhookEvent"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppWebhookEvent_from_idx" ON "WhatsAppWebhookEvent"("from");

-- CreateIndex
CREATE INDEX "WhatsAppWebhookEvent_createdAt_idx" ON "WhatsAppWebhookEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_orderId_key" ON "Receipt"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_notificationLogId_key" ON "Receipt"("notificationLogId");

-- CreateIndex
CREATE INDEX "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Receipt_generatedAt_idx" ON "Receipt"("generatedAt");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppWebhookEvent" ADD CONSTRAINT "WhatsAppWebhookEvent_notificationLogId_fkey" FOREIGN KEY ("notificationLogId") REFERENCES "NotificationLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_notificationLogId_fkey" FOREIGN KEY ("notificationLogId") REFERENCES "NotificationLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
