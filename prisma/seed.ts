import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

// KST 날짜 → @db.Date용 UTC Date (UTC date part = KST date)
function kstDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day))
}

// N days ago in KST → @db.Date용
function daysAgo(n: number): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const kst = new Date(utc + KST_OFFSET_MS)
  return new Date(Date.UTC(kst.getFullYear(), kst.getMonth(), kst.getDate() - n))
}

async function main() {
  // ==========================================
  // 1. 전부 날리기
  // ==========================================
  console.log('Cleaning all data...')
  await prisma.exerciseSet.deleteMany()
  await prisma.exerciseLog.deleteMany()
  await prisma.liftSession.deleteMany()
  await prisma.runSession.deleteMany()
  await prisma.sportSession.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.fatigueOverride.deleteMany()
  await prisma.bodyLog.deleteMany()
  await prisma.race.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.liftConfig.deleteMany()
  await prisma.equipmentConfig.deleteMany()

  // ==========================================
  // 2. LiftConfig
  // ==========================================
  await prisma.liftConfig.createMany({
    data: [
      { liftType: 'BENCH', tm: 60, cycleWeek: 'FIVE', tmIncrement: 5 },
      { liftType: 'SQUAT', tm: 80, cycleWeek: 'FIVE', tmIncrement: 5 },
      { liftType: 'OHP', tm: 40, cycleWeek: 'FIVE', tmIncrement: 5 },
      { liftType: 'DEAD', tm: 100, cycleWeek: 'FIVE', tmIncrement: 5 },
    ],
  })

  // ==========================================
  // 2.5 Equipment Configs
  // ==========================================
  await prisma.equipmentConfig.createMany({
    data: [
      { type: 'BARBELL', data: { barWeight: 20, platesPerSide: [20, 15, 10, 5, 5, 2.5] } },
      { type: 'DUMBBELL', data: { weights: [3, 5, 6, 8, 10, 12, 13, 15, 18, 20] } },
      { type: 'CABLE', data: { min: 5, max: 60, step: 5 } },
      { type: 'BODYWEIGHT', data: { extraWeights: [5, 10, 15, 20] } },
    ],
  })

  // Compute available weights from equipment configs
  const { computeAvailableWeights, DEFAULT_EQUIPMENT_CONFIGS } = await import('../lib/equipment')
  const barbellWeights = computeAvailableWeights('BARBELL', DEFAULT_EQUIPMENT_CONFIGS)
  const dumbbellWeights = computeAvailableWeights('DUMBBELL', DEFAULT_EQUIPMENT_CONFIGS)
  const cableWeights = computeAvailableWeights('CABLE', DEFAULT_EQUIPMENT_CONFIGS)
  const bwWeights = computeAvailableWeights('BODYWEIGHT', DEFAULT_EQUIPMENT_CONFIGS)

  // ==========================================
  // 3. Exercises (16개)
  // ==========================================
  await prisma.exercise.createMany({
    data: [
      // Bench Day
      { name: '벤치프레스', liftType: 'BENCH', role: 'MAIN', order: 0, targetSets: 3, targetMinReps: 1, targetMaxReps: 5, equipmentType: 'BARBELL', availableWeights: [] },
      { name: '바벨로우', liftType: 'BENCH', role: 'ACCESSORY', order: 2, targetSets: 4, targetMinReps: 8, targetMaxReps: 10, equipmentType: 'BARBELL', availableWeights: barbellWeights },
      { name: '인클라인 DB프레스', liftType: 'BENCH', role: 'ACCESSORY', order: 3, targetSets: 3, targetMinReps: 10, targetMaxReps: 12, equipmentType: 'DUMBBELL', availableWeights: dumbbellWeights },
      { name: '페이스풀', liftType: 'BENCH', role: 'ACCESSORY', order: 4, targetSets: 3, targetMinReps: 15, targetMaxReps: 20, equipmentType: 'CABLE', availableWeights: cableWeights },
      // Squat Day
      { name: '스쿼트', liftType: 'SQUAT', role: 'MAIN', order: 0, targetSets: 3, targetMinReps: 1, targetMaxReps: 5, equipmentType: 'BARBELL', availableWeights: [] },
      { name: 'RDL', liftType: 'SQUAT', role: 'ACCESSORY', order: 2, targetSets: 3, targetMinReps: 8, targetMaxReps: 10, equipmentType: 'BARBELL', availableWeights: barbellWeights },
      { name: '불가리안 스플릿 스쿼트', liftType: 'SQUAT', role: 'ACCESSORY', order: 3, targetSets: 3, targetMinReps: 8, targetMaxReps: 10, equipmentType: 'DUMBBELL', availableWeights: dumbbellWeights },
      { name: '카프레이즈', liftType: 'SQUAT', role: 'ACCESSORY', order: 4, targetSets: 3, targetMinReps: 15, targetMaxReps: 20, equipmentType: 'DUMBBELL', availableWeights: dumbbellWeights },
      // OHP Day
      { name: 'OHP', liftType: 'OHP', role: 'MAIN', order: 0, targetSets: 3, targetMinReps: 1, targetMaxReps: 5, equipmentType: 'BARBELL', availableWeights: [] },
      { name: '풀업', liftType: 'OHP', role: 'ACCESSORY', order: 2, targetSets: 4, targetMinReps: 8, targetMaxReps: 10, equipmentType: 'BODYWEIGHT', availableWeights: bwWeights },
      { name: '사이드 레터럴레이즈', liftType: 'OHP', role: 'ACCESSORY', order: 3, targetSets: 3, targetMinReps: 12, targetMaxReps: 15, equipmentType: 'DUMBBELL', availableWeights: dumbbellWeights },
      { name: '바이셉 컬', liftType: 'OHP', role: 'ACCESSORY', order: 4, targetSets: 3, targetMinReps: 12, targetMaxReps: 15, equipmentType: 'DUMBBELL', availableWeights: dumbbellWeights },
      // Dead Day
      { name: '데드리프트', liftType: 'DEAD', role: 'MAIN', order: 0, targetSets: 3, targetMinReps: 1, targetMaxReps: 5, equipmentType: 'BARBELL', availableWeights: [] },
      { name: '불가리안 스플릿 스쿼트 (데드)', liftType: 'DEAD', role: 'ACCESSORY', order: 2, targetSets: 3, targetMinReps: 8, targetMaxReps: 10, equipmentType: 'DUMBBELL', availableWeights: dumbbellWeights },
      { name: '레그 컬', liftType: 'DEAD', role: 'ACCESSORY', order: 3, targetSets: 3, targetMinReps: 10, targetMaxReps: 12, equipmentType: 'CABLE', availableWeights: cableWeights },
      { name: '카프레이즈 (데드)', liftType: 'DEAD', role: 'ACCESSORY', order: 4, targetSets: 3, targetMinReps: 15, targetMaxReps: 20, equipmentType: 'CABLE', availableWeights: cableWeights },
    ],
  })

  const exercises = await prisma.exercise.findMany()
  const exByName = Object.fromEntries(exercises.map(e => [e.name, e]))

  // ==========================================
  // 4. 지난 2주 활동 더미 (KST 기준)
  // ==========================================

  // Helper: create lift activity with sets
  async function createLift(date: Date, liftType: 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD', mainWeight: number, mainSets: { reps: number, weight: number }[], accessories: { name: string, sets: { weight: number, reps: number }[] }[]) {
    const activity = await prisma.activity.create({
      data: {
        date,
        type: 'LIFT',
        liftSession: {
          create: {
            liftType,
            date,
            duration: 60 + Math.floor(Math.random() * 20),
            completed: true,
          },
        },
      },
      include: { liftSession: true },
    })

    const session = activity.liftSession!

    // Main exercise logs + sets
    const mainEx = exercises.find(e => e.liftType === liftType && e.role === 'MAIN')!
    const mainLog = await prisma.exerciseLog.create({
      data: { liftSessionId: session.id, exerciseId: mainEx.id, order: 0 },
    })
    for (let i = 0; i < mainSets.length; i++) {
      await prisma.exerciseSet.create({
        data: { exerciseLogId: mainLog.id, setNumber: i + 1, weight: mainSets[i].weight, reps: mainSets[i].reps },
      })
    }

    // Accessory logs + sets
    for (const acc of accessories) {
      const ex = exByName[acc.name]
      if (!ex) continue
      const log = await prisma.exerciseLog.create({
        data: { liftSessionId: session.id, exerciseId: ex.id, order: ex.order },
      })
      for (let i = 0; i < acc.sets.length; i++) {
        await prisma.exerciseSet.create({
          data: { exerciseLogId: log.id, setNumber: i + 1, weight: acc.sets[i].weight, reps: acc.sets[i].reps },
        })
      }
    }
  }

  async function createRun(date: Date, runType: 'EASY' | 'QUALITY' | 'LONG', distanceKm: number, durationSec: number) {
    await prisma.activity.create({
      data: {
        date,
        type: 'RUN',
        runSession: {
          create: { date, runType, distanceKm, durationSec, avgPace: Math.round(durationSec / distanceKm) },
        },
      },
    })
  }

  async function createRest(date: Date) {
    await prisma.activity.create({ data: { date, type: 'REST' } })
  }

  // --- 2주 전 (월~일) ---
  // 월: Bench
  await createLift(daysAgo(13), 'BENCH', 60, [
    { weight: 39, reps: 5 }, { weight: 45, reps: 5 }, { weight: 51, reps: 8 },
    // BBB
    { weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 },
  ], [
    { name: '바벨로우', sets: [{ weight: 45, reps: 10 }, { weight: 45, reps: 10 }, { weight: 45, reps: 9 }, { weight: 45, reps: 8 }] },
    { name: '인클라인 DB프레스', sets: [{ weight: 18, reps: 12 }, { weight: 18, reps: 11 }, { weight: 18, reps: 10 }] },
    { name: '페이스풀', sets: [{ weight: 15, reps: 20 }, { weight: 15, reps: 18 }, { weight: 15, reps: 16 }] },
  ])

  // 화: Easy Run
  await createRun(daysAgo(12), 'EASY', 5.2, 1872) // 6:00/km

  // 수: Squat
  await createLift(daysAgo(11), 'SQUAT', 80, [
    { weight: 52, reps: 5 }, { weight: 60, reps: 5 }, { weight: 68, reps: 7 },
    { weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 40, reps: 10 },
  ], [
    { name: 'RDL', sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 9 }] },
    { name: '불가리안 스플릿 스쿼트', sets: [{ weight: 14, reps: 10 }, { weight: 14, reps: 10 }, { weight: 14, reps: 9 }] },
    { name: '카프레이즈', sets: [{ weight: 40, reps: 20 }, { weight: 40, reps: 18 }, { weight: 40, reps: 16 }] },
  ])

  // 목: Rest
  await createRest(daysAgo(10))

  // 금: OHP
  await createLift(daysAgo(9), 'OHP', 40, [
    { weight: 26, reps: 5 }, { weight: 30, reps: 5 }, { weight: 34, reps: 9 },
    { weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 },
  ], [
    { name: '풀업', sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 9 }, { weight: 0, reps: 8 }, { weight: 0, reps: 7 }] },
    { name: '사이드 레터럴레이즈', sets: [{ weight: 10, reps: 15 }, { weight: 10, reps: 14 }, { weight: 10, reps: 12 }] },
    { name: '바이셉 컬', sets: [{ weight: 12, reps: 15 }, { weight: 12, reps: 14 }, { weight: 12, reps: 12 }] },
  ])

  // 토: Long Run
  await createRun(daysAgo(8), 'LONG', 10.1, 3636) // 6:00/km

  // 일: Rest
  await createRest(daysAgo(7))

  // --- 지난 주 (월~일) ---
  // 월: Dead
  await createLift(daysAgo(6), 'DEAD', 100, [
    { weight: 65, reps: 5 }, { weight: 75, reps: 5 }, { weight: 85, reps: 6 },
    { weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 },
  ], [
    { name: '불가리안 스플릿 스쿼트 (데드)', sets: [{ weight: 14, reps: 10 }, { weight: 14, reps: 10 }, { weight: 14, reps: 9 }] },
    { name: '레그 컬', sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 11 }, { weight: 30, reps: 10 }] },
    { name: '카프레이즈 (데드)', sets: [{ weight: 40, reps: 20 }, { weight: 40, reps: 18 }, { weight: 40, reps: 16 }] },
  ])

  // 화: Easy Run
  await createRun(daysAgo(5), 'EASY', 5.0, 1750) // 5:50/km

  // 수: Bench
  await createLift(daysAgo(4), 'BENCH', 60, [
    { weight: 39, reps: 5 }, { weight: 45, reps: 5 }, { weight: 51, reps: 9 },
    { weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 },
  ], [
    { name: '바벨로우', sets: [{ weight: 45, reps: 10 }, { weight: 45, reps: 10 }, { weight: 45, reps: 10 }, { weight: 45, reps: 9 }] },
    { name: '인클라인 DB프레스', sets: [{ weight: 20, reps: 12 }, { weight: 20, reps: 11 }, { weight: 20, reps: 10 }] },
    { name: '페이스풀', sets: [{ weight: 15, reps: 20 }, { weight: 15, reps: 20 }, { weight: 15, reps: 18 }] },
  ])

  // 목: Quality Run
  await createRun(daysAgo(3), 'QUALITY', 6.5, 2145) // 5:30/km

  // 금: Squat
  await createLift(daysAgo(2), 'SQUAT', 80, [
    { weight: 52, reps: 5 }, { weight: 60, reps: 5 }, { weight: 68, reps: 8 },
    { weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 40, reps: 10 },
  ], [
    { name: 'RDL', sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
    { name: '불가리안 스플릿 스쿼트', sets: [{ weight: 16, reps: 10 }, { weight: 16, reps: 10 }, { weight: 16, reps: 9 }] },
    { name: '카프레이즈', sets: [{ weight: 40, reps: 20 }, { weight: 40, reps: 20 }, { weight: 40, reps: 18 }] },
  ])

  // 토: Long Run
  await createRun(daysAgo(1), 'LONG', 11.0, 3960) // 6:00/km

  // ==========================================
  // 5. BodyLog 더미 (최근 7일)
  // ==========================================
  const bodyWeights = [75.2, 74.8, 75.0, 74.6, 75.1, 74.9, 74.7]
  for (let i = 6; i >= 0; i--) {
    await prisma.bodyLog.create({
      data: {
        date: daysAgo(i),
        weight: bodyWeights[6 - i],
        bodyFat: 15.0 + Math.round((Math.random() - 0.5) * 2 * 10) / 10,
      },
    })
  }

  // ==========================================
  // 6. Race 더미
  // ==========================================
  await prisma.race.create({
    data: {
      name: '서울 하프마라톤',
      date: kstDate(2026, 5, 10),
      distanceKm: 21.1,
      goalTime: '1:45:00',
      weeklyTargetKm: 35,
      status: 'UPCOMING',
    },
  })

  console.log('Seed complete! All data reset with KST dates.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
