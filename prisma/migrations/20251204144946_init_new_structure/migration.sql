-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CAREGIVER', 'DEPENDENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('DETECTED', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "HelpType" AS ENUM ('LINE_SOS', 'WATCH_SOS');

-- CreateEnum
CREATE TYPE "BorrowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RETURN_PENDING', 'RETURNED', 'RETURN_FAILED');

-- CreateEnum
CREATE TYPE "ZoneStatus" AS ENUM ('SAFE', 'WARNING', 'DANGER');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('NORMAL', 'ABNORMAL');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "lineId" TEXT,
    "token" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CAREGIVER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caregiver_profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'UNSPECIFIED',
    "marital" "MaritalStatus" NOT NULL DEFAULT 'SINGLE',
    "phone" TEXT NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "houseNumber" VARCHAR(10) NOT NULL,
    "village" VARCHAR(5) NOT NULL,
    "road" VARCHAR(200),
    "subDistrict" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(5) NOT NULL,
    "isGpsAlertOn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caregiver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependent_profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'UNSPECIFIED',
    "marital" "MaritalStatus" NOT NULL DEFAULT 'SINGLE',
    "phone" TEXT NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "diseases" TEXT,
    "medications" TEXT,
    "houseNumber" VARCHAR(10) NOT NULL,
    "village" VARCHAR(5) NOT NULL,
    "road" VARCHAR(200),
    "subDistrict" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(5) NOT NULL,
    "caregiverId" INTEGER,
    "pin" VARCHAR(4) NOT NULL DEFAULT '1234',
    "isGpsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isSafezoneAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "isHeartRateAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "isTemperatureAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dependent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "dependentId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distance" INTEGER NOT NULL DEFAULT 0,
    "battery" INTEGER NOT NULL DEFAULT 0,
    "status" "ZoneStatus" NOT NULL DEFAULT 'SAFE',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heart_rate_records" (
    "id" SERIAL NOT NULL,
    "dependentId" INTEGER NOT NULL,
    "bpm" INTEGER NOT NULL,
    "status" "HealthStatus" NOT NULL DEFAULT 'NORMAL',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordDate" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "heart_rate_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_records" (
    "id" SERIAL NOT NULL,
    "dependentId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "status" "HealthStatus" NOT NULL DEFAULT 'NORMAL',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordDate" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "temperature_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fall_records" (
    "id" SERIAL NOT NULL,
    "dependentId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "xAxis" DOUBLE PRECISION,
    "yAxis" DOUBLE PRECISION,
    "zAxis" DOUBLE PRECISION,
    "status" "AlertStatus" NOT NULL DEFAULT 'DETECTED',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fall_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extended_help" (
    "id" SERIAL NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "dependentId" INTEGER NOT NULL,
    "type" "HelpType" NOT NULL DEFAULT 'LINE_SOS',
    "status" "AlertStatus" NOT NULL DEFAULT 'DETECTED',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "details" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "extended_help_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safe_zones" (
    "id" SERIAL NOT NULL,
    "dependentId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusLv1" INTEGER NOT NULL DEFAULT 100,
    "radiusLv2" INTEGER NOT NULL DEFAULT 500,

    CONSTRAINT "safe_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heart_rate_settings" (
    "id" SERIAL NOT NULL,
    "dependentId" INTEGER NOT NULL,
    "maxBpm" INTEGER NOT NULL DEFAULT 120,
    "minBpm" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "heart_rate_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_settings" (
    "id" SERIAL NOT NULL,
    "dependentId" INTEGER NOT NULL,
    "maxTemperature" DOUBLE PRECISION NOT NULL DEFAULT 37.5,

    CONSTRAINT "temperature_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrow_requests" (
    "id" SERIAL NOT NULL,
    "borrowerId" INTEGER NOT NULL,
    "dependentId" INTEGER NOT NULL,
    "objective" TEXT,
    "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnDate" TIMESTAMP(3),
    "status" "BorrowStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrow_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrow_request_items" (
    "id" SERIAL NOT NULL,
    "borrowId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,

    CONSTRAINT "borrow_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_lineId_key" ON "users"("lineId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "caregiver_profiles_userId_key" ON "caregiver_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dependent_profiles_userId_key" ON "dependent_profiles"("userId");

-- CreateIndex
CREATE INDEX "locations_dependentId_idx" ON "locations"("dependentId");

-- CreateIndex
CREATE INDEX "heart_rate_records_dependentId_idx" ON "heart_rate_records"("dependentId");

-- CreateIndex
CREATE INDEX "temperature_records_dependentId_idx" ON "temperature_records"("dependentId");

-- CreateIndex
CREATE INDEX "fall_records_dependentId_idx" ON "fall_records"("dependentId");

-- CreateIndex
CREATE UNIQUE INDEX "heart_rate_settings_dependentId_key" ON "heart_rate_settings"("dependentId");

-- CreateIndex
CREATE UNIQUE INDEX "temperature_settings_dependentId_key" ON "temperature_settings"("dependentId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_code_key" ON "equipment"("code");

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caregiver_profiles" ADD CONSTRAINT "caregiver_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependent_profiles" ADD CONSTRAINT "dependent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependent_profiles" ADD CONSTRAINT "dependent_profiles_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregiver_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heart_rate_records" ADD CONSTRAINT "heart_rate_records_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_records" ADD CONSTRAINT "temperature_records_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fall_records" ADD CONSTRAINT "fall_records_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extended_help" ADD CONSTRAINT "extended_help_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "caregiver_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extended_help" ADD CONSTRAINT "extended_help_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safe_zones" ADD CONSTRAINT "safe_zones_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heart_rate_settings" ADD CONSTRAINT "heart_rate_settings_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_settings" ADD CONSTRAINT "temperature_settings_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "caregiver_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_request_items" ADD CONSTRAINT "borrow_request_items_borrowId_fkey" FOREIGN KEY ("borrowId") REFERENCES "borrow_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_request_items" ADD CONSTRAINT "borrow_request_items_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
