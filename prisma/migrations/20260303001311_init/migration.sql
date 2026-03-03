-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LIFT', 'RUN');

-- CreateEnum
CREATE TYPE "ModuleCode" AS ENUM ('SQ', 'HN', 'PU', 'VU', 'PL', 'RL');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RaceStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'DNS', 'DNF');

-- CreateEnum
CREATE TYPE "RunPhase" AS ENUM ('BASE', 'BUILD', 'PEAK', 'TAPER', 'RACE_WEEK', 'RECOVERY');

-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('EASY', 'TEMPO', 'INTERVAL', 'LONG', 'RECOVERY', 'RACE', 'FARTLEK');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "ActivityType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "moduleCode" "ModuleCode" NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftCycle" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "splitCount" INTEGER NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiftCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitDay" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SplitDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitModule" (
    "id" TEXT NOT NULL,
    "splitDayId" TEXT NOT NULL,
    "moduleCode" "ModuleCode" NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SplitModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftSession" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "splitDayId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "duration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiftSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "moduleCode" "ModuleCode" NOT NULL,
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSet" (
    "id" TEXT NOT NULL,
    "exerciseLogId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "rpe" DOUBLE PRECISION,
    "isWarmup" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "goalTime" INTEGER,
    "actualTime" INTEGER,
    "status" "RaceStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunPlan" (
    "id" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunWeek" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "targetKm" DOUBLE PRECISION NOT NULL,
    "phase" "RunPhase" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunSession" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "avgPace" INTEGER NOT NULL,
    "rpe" DOUBLE PRECISION,
    "runType" "RunType" NOT NULL,
    "notes" TEXT,
    "raceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_moduleCode_key" ON "Exercise"("name", "moduleCode");

-- CreateIndex
CREATE UNIQUE INDEX "SplitDay_cycleId_dayLabel_key" ON "SplitDay"("cycleId", "dayLabel");

-- CreateIndex
CREATE UNIQUE INDEX "SplitModule_splitDayId_moduleCode_key" ON "SplitModule"("splitDayId", "moduleCode");

-- CreateIndex
CREATE UNIQUE INDEX "LiftSession_activityId_key" ON "LiftSession"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseLog_sessionId_exerciseId_key" ON "ExerciseLog"("sessionId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "RunPlan_raceId_key" ON "RunPlan"("raceId");

-- CreateIndex
CREATE UNIQUE INDEX "RunWeek_planId_weekNumber_key" ON "RunWeek"("planId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RunSession_activityId_key" ON "RunSession"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyLog_date_key" ON "BodyLog"("date");

-- AddForeignKey
ALTER TABLE "SplitDay" ADD CONSTRAINT "SplitDay_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "LiftCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitModule" ADD CONSTRAINT "SplitModule_splitDayId_fkey" FOREIGN KEY ("splitDayId") REFERENCES "SplitDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftSession" ADD CONSTRAINT "LiftSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftSession" ADD CONSTRAINT "LiftSession_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "LiftCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftSession" ADD CONSTRAINT "LiftSession_splitDayId_fkey" FOREIGN KEY ("splitDayId") REFERENCES "SplitDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiftSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSet" ADD CONSTRAINT "ExerciseSet_exerciseLogId_fkey" FOREIGN KEY ("exerciseLogId") REFERENCES "ExerciseLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunPlan" ADD CONSTRAINT "RunPlan_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunWeek" ADD CONSTRAINT "RunWeek_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RunPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunSession" ADD CONSTRAINT "RunSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
