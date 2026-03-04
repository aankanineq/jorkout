-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LIFT', 'RUN', 'SPORT', 'REST');

-- CreateEnum
CREATE TYPE "LiftType" AS ENUM ('BENCH', 'SQUAT', 'OHP', 'DEAD');

-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('EASY', 'QUALITY', 'LONG');

-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('TENNIS', 'SOCCER', 'OTHER');

-- CreateEnum
CREATE TYPE "CycleWeek" AS ENUM ('FIVE', 'THREE', 'ONE');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "ActivityType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftConfig" (
    "id" TEXT NOT NULL,
    "liftType" "LiftType" NOT NULL,
    "tm" DOUBLE PRECISION NOT NULL,
    "cycleWeek" "CycleWeek" NOT NULL,
    "tmIncrement" DOUBLE PRECISION NOT NULL DEFAULT 5,

    CONSTRAINT "LiftConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "liftType" "LiftType" NOT NULL,
    "role" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "targetSets" INTEGER NOT NULL,
    "targetMinReps" INTEGER NOT NULL,
    "targetMaxReps" INTEGER NOT NULL,
    "availableWeights" DOUBLE PRECISION[],

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FatigueOverride" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "zone" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FatigueOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftSession" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "liftType" "LiftType" NOT NULL,
    "date" DATE NOT NULL,
    "duration" INTEGER,

    CONSTRAINT "LiftSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseLog" (
    "id" TEXT NOT NULL,
    "liftSessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ExerciseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSet" (
    "id" TEXT NOT NULL,
    "exerciseLogId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "isWarmup" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExerciseSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunSession" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "runType" "RunType" NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "avgPace" INTEGER NOT NULL,
    "raceId" TEXT,

    CONSTRAINT "RunSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportSession" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sportType" "SportType" NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "rpe" INTEGER,
    "notes" TEXT,

    CONSTRAINT "SportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "goalTime" TEXT,
    "actualTime" TEXT,
    "weeklyTargetKm" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,

    CONSTRAINT "BodyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiftConfig_liftType_key" ON "LiftConfig"("liftType");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FatigueOverride_date_zone_key" ON "FatigueOverride"("date", "zone");

-- CreateIndex
CREATE UNIQUE INDEX "LiftSession_activityId_key" ON "LiftSession"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "RunSession_activityId_key" ON "RunSession"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "SportSession_activityId_key" ON "SportSession"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyLog_date_key" ON "BodyLog"("date");

-- AddForeignKey
ALTER TABLE "LiftSession" ADD CONSTRAINT "LiftSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_liftSessionId_fkey" FOREIGN KEY ("liftSessionId") REFERENCES "LiftSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSet" ADD CONSTRAINT "ExerciseSet_exerciseLogId_fkey" FOREIGN KEY ("exerciseLogId") REFERENCES "ExerciseLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunSession" ADD CONSTRAINT "RunSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportSession" ADD CONSTRAINT "SportSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
