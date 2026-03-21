-- CreateTable: runs
CREATE TABLE "runs" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "minutes" INTEGER NOT NULL,
    "pace" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: gyms
CREATE TABLE "gyms" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "exercise" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION,
    "rpe" DOUBLE PRECISION,
    "memo" TEXT,
    "raw" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "runs_date_idx" ON "runs"("date");

-- CreateIndex
CREATE INDEX "gyms_date_idx" ON "gyms"("date");

-- CreateIndex
CREATE INDEX "gyms_exercise_idx" ON "gyms"("exercise");
