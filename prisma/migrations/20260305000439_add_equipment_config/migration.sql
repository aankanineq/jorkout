-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "equipmentType" TEXT NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "EquipmentConfig" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "EquipmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentConfig_type_key" ON "EquipmentConfig"("type");
