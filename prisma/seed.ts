import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clean up (order matters due to foreign keys)
  await prisma.exerciseSet.deleteMany()
  await prisma.exerciseLog.deleteMany()
  await prisma.liftSession.deleteMany()
  await prisma.splitModule.deleteMany()
  await prisma.splitDay.deleteMany()
  await prisma.liftCycle.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.runSession.deleteMany()
  await prisma.runWeek.deleteMany()
  await prisma.runPlan.deleteMany()
  await prisma.race.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.bodyLog.deleteMany()

  // ============================================
  // 운동 라이브러리 (더미)
  // ============================================
  const exercises = await Promise.all([
    // SQ
    prisma.exercise.create({ data: { name: 'Barbell Back Squat', moduleCode: 'SQ', isMain: true } }),
    prisma.exercise.create({ data: { name: 'Leg Press', moduleCode: 'SQ' } }),
    prisma.exercise.create({ data: { name: 'Bulgarian Split Squat', moduleCode: 'SQ' } }),
    prisma.exercise.create({ data: { name: 'Leg Extension', moduleCode: 'SQ' } }),
    // HN
    prisma.exercise.create({ data: { name: 'Conventional Deadlift', moduleCode: 'HN', isMain: true } }),
    prisma.exercise.create({ data: { name: 'Romanian Deadlift', moduleCode: 'HN' } }),
    prisma.exercise.create({ data: { name: 'Hip Thrust', moduleCode: 'HN' } }),
    prisma.exercise.create({ data: { name: 'Leg Curl', moduleCode: 'HN' } }),
    // PU
    prisma.exercise.create({ data: { name: 'Barbell Bench Press', moduleCode: 'PU', isMain: true } }),
    prisma.exercise.create({ data: { name: 'Dumbbell Incline Press', moduleCode: 'PU' } }),
    prisma.exercise.create({ data: { name: 'Cable Fly', moduleCode: 'PU' } }),
    prisma.exercise.create({ data: { name: 'Dips', moduleCode: 'PU' } }),
    // VU
    prisma.exercise.create({ data: { name: 'Barbell OHP', moduleCode: 'VU', isMain: true } }),
    prisma.exercise.create({ data: { name: 'Dumbbell Shoulder Press', moduleCode: 'VU' } }),
    prisma.exercise.create({ data: { name: 'Lateral Raise', moduleCode: 'VU' } }),
    prisma.exercise.create({ data: { name: 'Face Pull', moduleCode: 'VU' } }),
    // PL
    prisma.exercise.create({ data: { name: 'Pull-up', moduleCode: 'PL', isMain: true } }),
    prisma.exercise.create({ data: { name: 'Wide Grip Lat Pulldown', moduleCode: 'PL' } }),
    prisma.exercise.create({ data: { name: 'Straight Arm Pulldown', moduleCode: 'PL' } }),
    // RL
    prisma.exercise.create({ data: { name: 'Barbell Row', moduleCode: 'RL', isMain: true } }),
    prisma.exercise.create({ data: { name: 'Cable Row', moduleCode: 'RL' } }),
    prisma.exercise.create({ data: { name: 'Dumbbell Row', moduleCode: 'RL' } }),
    prisma.exercise.create({ data: { name: 'Rear Delt Fly', moduleCode: 'RL' } }),
  ])

  console.log(`✅ ${exercises.length}개 Exercise 생성`)

  // ============================================
  // 대회
  // ============================================
  const race = await prisma.race.create({
    data: {
      name: '2026 춘천 하프마라톤',
      date: new Date('2026-05-30'),
      distance: 21.0975,
      goalTime: 7200, // 2:00:00
      status: 'UPCOMING',
    },
  })

  console.log(`✅ Race: ${race.name}`)

  // ============================================
  // 리프팅 사이클 (3분할)
  // ============================================
  const cycle = await prisma.liftCycle.create({
    data: {
      number: 1,
      splitCount: 3,
      status: 'ACTIVE',
      startDate: new Date('2026-03-03'),
    },
  })

  const splitA = await prisma.splitDay.create({
    data: { cycleId: cycle.id, dayLabel: 'A', order: 0 },
  })
  const splitB = await prisma.splitDay.create({
    data: { cycleId: cycle.id, dayLabel: 'B', order: 1 },
  })
  const splitC = await prisma.splitDay.create({
    data: { cycleId: cycle.id, dayLabel: 'C', order: 2 },
  })

  // A: SQ + VU
  await prisma.splitModule.createMany({
    data: [
      { splitDayId: splitA.id, moduleCode: 'SQ', order: 0 },
      { splitDayId: splitA.id, moduleCode: 'VU', order: 1 },
    ],
  })
  // B: HN + PL
  await prisma.splitModule.createMany({
    data: [
      { splitDayId: splitB.id, moduleCode: 'HN', order: 0 },
      { splitDayId: splitB.id, moduleCode: 'PL', order: 1 },
    ],
  })
  // C: PU + RL
  await prisma.splitModule.createMany({
    data: [
      { splitDayId: splitC.id, moduleCode: 'PU', order: 0 },
      { splitDayId: splitC.id, moduleCode: 'RL', order: 1 },
    ],
  })

  console.log(`✅ LiftCycle #${cycle.number} (3분할: A=SQ+VU, B=HN+PL, C=PU+RL)`)

  // ============================================
  // 샘플 리프팅 세션
  // ============================================
  const liftActivity = await prisma.activity.create({
    data: { date: new Date('2026-03-03'), type: 'LIFT' },
  })

  const squat = exercises.find(e => e.name === 'Barbell Back Squat')!
  const legPress = exercises.find(e => e.name === 'Leg Press')!
  const ohp = exercises.find(e => e.name === 'Barbell OHP')!
  const lateralRaise = exercises.find(e => e.name === 'Lateral Raise')!

  const liftSession = await prisma.liftSession.create({
    data: {
      activityId: liftActivity.id,
      cycleId: cycle.id,
      splitDayId: splitA.id,
      date: new Date('2026-03-03'),
      duration: 65,
      notes: '첫 세션',
    },
  })

  // Squat logs
  const sqLog = await prisma.exerciseLog.create({
    data: {
      sessionId: liftSession.id,
      exerciseId: squat.id,
      moduleCode: 'SQ',
      order: 0,
    },
  })
  await prisma.exerciseSet.createMany({
    data: [
      { exerciseLogId: sqLog.id, setNumber: 1, weight: 60, reps: 8, rpe: 7 },
      { exerciseLogId: sqLog.id, setNumber: 2, weight: 60, reps: 8, rpe: 7.5 },
      { exerciseLogId: sqLog.id, setNumber: 3, weight: 60, reps: 7, rpe: 8 },
    ],
  })

  // Leg press logs
  const lpLog = await prisma.exerciseLog.create({
    data: {
      sessionId: liftSession.id,
      exerciseId: legPress.id,
      moduleCode: 'SQ',
      order: 1,
    },
  })
  await prisma.exerciseSet.createMany({
    data: [
      { exerciseLogId: lpLog.id, setNumber: 1, weight: 100, reps: 12, rpe: 7 },
      { exerciseLogId: lpLog.id, setNumber: 2, weight: 100, reps: 10, rpe: 8 },
    ],
  })

  // OHP logs
  const ohpLog = await prisma.exerciseLog.create({
    data: {
      sessionId: liftSession.id,
      exerciseId: ohp.id,
      moduleCode: 'VU',
      order: 2,
    },
  })
  await prisma.exerciseSet.createMany({
    data: [
      { exerciseLogId: ohpLog.id, setNumber: 1, weight: 40, reps: 8, rpe: 7 },
      { exerciseLogId: ohpLog.id, setNumber: 2, weight: 40, reps: 7, rpe: 8 },
      { exerciseLogId: ohpLog.id, setNumber: 3, weight: 40, reps: 6, rpe: 8.5 },
    ],
  })

  // Lateral raise logs
  const lrLog = await prisma.exerciseLog.create({
    data: {
      sessionId: liftSession.id,
      exerciseId: lateralRaise.id,
      moduleCode: 'VU',
      order: 3,
    },
  })
  await prisma.exerciseSet.createMany({
    data: [
      { exerciseLogId: lrLog.id, setNumber: 1, weight: 8, reps: 15, rpe: 7 },
      { exerciseLogId: lrLog.id, setNumber: 2, weight: 8, reps: 12, rpe: 8 },
    ],
  })

  console.log(`✅ 샘플 LiftSession (Split A: 4 exercises, 10 sets)`)

  // ============================================
  // 샘플 러닝 세션
  // ============================================
  const runActivity = await prisma.activity.create({
    data: { date: new Date('2026-03-02'), type: 'RUN' },
  })

  await prisma.runSession.create({
    data: {
      activityId: runActivity.id,
      date: new Date('2026-03-02'),
      distanceKm: 5.0,
      durationSec: 1800, // 30분
      avgPace: 360, // 6:00/km
      rpe: 5,
      runType: 'EASY',
      notes: '재개 첫 런',
    },
  })

  console.log(`✅ 샘플 RunSession (5km easy)`)

  console.log('\n🎉 시드 완료!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
