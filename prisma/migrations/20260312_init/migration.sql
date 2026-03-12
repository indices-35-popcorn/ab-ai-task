-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AppealCategory" AS ENUM ('CHANGE_PROVIDER');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('APPROVED', 'PENDING', 'CANCELLED');

-- CreateTable
CREATE TABLE "Appeal" (
    "id" TEXT NOT NULL,
    "category" "AppealCategory" NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppealChild" (
    "id" TEXT NOT NULL,
    "appealId" TEXT NOT NULL,
    "childIin" TEXT NOT NULL,
    "childName" TEXT NOT NULL,

    CONSTRAINT "AppealChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "iin" TEXT NOT NULL,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportsCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportsCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportsCenterProgram" (
    "id" TEXT NOT NULL,
    "sportsCenterId" TEXT NOT NULL,
    "sportType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "SportsCenterProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "sportsCenterId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppealChild_appealId_idx" ON "AppealChild"("appealId");

-- CreateIndex
CREATE INDEX "AppealChild_childIin_idx" ON "AppealChild"("childIin");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_iin_key" ON "AthleteProfile"("iin");

-- CreateIndex
CREATE INDEX "SportsCenterProgram_sportsCenterId_sportType_idx" ON "SportsCenterProgram"("sportsCenterId", "sportType");

-- CreateIndex
CREATE INDEX "Enrollment_athleteProfileId_status_idx" ON "Enrollment"("athleteProfileId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_sportsCenterId_idx" ON "Enrollment"("sportsCenterId");

-- CreateIndex
CREATE INDEX "Enrollment_programId_idx" ON "Enrollment"("programId");

-- AddForeignKey
ALTER TABLE "AppealChild" ADD CONSTRAINT "AppealChild_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "Appeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportsCenterProgram" ADD CONSTRAINT "SportsCenterProgram_sportsCenterId_fkey" FOREIGN KEY ("sportsCenterId") REFERENCES "SportsCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sportsCenterId_fkey" FOREIGN KEY ("sportsCenterId") REFERENCES "SportsCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "SportsCenterProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

