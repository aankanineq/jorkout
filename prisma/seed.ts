import { PrismaClient, SplitType } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ============================================
// 세션별 세트 데이터 타입
// ============================================
type SetInput = { weight: number; reps: number }

type SessionPlan = {
  date: string
  splitType: SplitType
  duration: number
  exercises: Record<string, SetInput[]>
}

async function main() {
  // Clean up
  await prisma.exerciseSet.deleteMany()
  await prisma.exerciseLog.deleteMany()
  await prisma.liftSession.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.runSession.deleteMany()
  await prisma.runWeek.deleteMany()
  await prisma.runPlan.deleteMany()
  await prisma.race.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.bodyLog.deleteMany()

  // ============================================
  // 운동 라이브러리 (고정 PPL 11개)
  // ============================================
  const exercises = await Promise.all([
    prisma.exercise.create({ data: { name: 'Bench Press', splitType: 'PUSH', role: 'MAIN', targetSets: 2, targetMinReps: 5, targetMaxReps: 8, order: 0 } }),
    prisma.exercise.create({ data: { name: 'OHP', splitType: 'PUSH', role: 'MAIN', targetSets: 2, targetMinReps: 5, targetMaxReps: 8, order: 1 } }),
    prisma.exercise.create({ data: { name: 'Shoulder DB Press', splitType: 'PUSH', role: 'VOLUME', targetSets: 4, targetMinReps: 8, targetMaxReps: 12, order: 2 } }),
    prisma.exercise.create({ data: { name: 'Pull-up', splitType: 'PULL', role: 'MAIN', targetSets: 2, targetMinReps: 5, targetMaxReps: 8, order: 0 } }),
    prisma.exercise.create({ data: { name: 'Barbell Row', splitType: 'PULL', role: 'MAIN', targetSets: 2, targetMinReps: 5, targetMaxReps: 8, order: 1 } }),
    prisma.exercise.create({ data: { name: 'Lat Pulldown', splitType: 'PULL', role: 'VOLUME', targetSets: 2, targetMinReps: 8, targetMaxReps: 12, order: 2 } }),
    prisma.exercise.create({ data: { name: 'One-arm DB Row', splitType: 'PULL', role: 'VOLUME', targetSets: 2, targetMinReps: 8, targetMaxReps: 12, order: 3 } }),
    prisma.exercise.create({ data: { name: 'Squat', splitType: 'LEG', role: 'MAIN', targetSets: 2, targetMinReps: 5, targetMaxReps: 8, order: 0 } }),
    prisma.exercise.create({ data: { name: 'Deadlift', splitType: 'LEG', role: 'MAIN', targetSets: 2, targetMinReps: 5, targetMaxReps: 8, order: 1 } }),
    prisma.exercise.create({ data: { name: 'Bulgarian Split Squat', splitType: 'LEG', role: 'VOLUME', targetSets: 2, targetMinReps: 8, targetMaxReps: 12, order: 2 } }),
    prisma.exercise.create({ data: { name: 'Hip Thrust', splitType: 'LEG', role: 'VOLUME', targetSets: 2, targetMinReps: 8, targetMaxReps: 12, order: 3 } }),
  ])

  console.log(`✅ ${exercises.length}개 Exercise 생성`)

  const ex = Object.fromEntries(exercises.map(e => [e.name, e]))

  // ============================================
  // 대회
  // ============================================
  const race = await prisma.race.create({
    data: {
      name: '2026 춘천 하프마라톤',
      date: new Date('2026-05-30'),
      distance: 21.0975,
      goalTime: 7200,
      status: 'UPCOMING',
    },
  })
  console.log(`✅ Race: ${race.name}`)

  // ============================================
  // 5주치 리프팅 세션 (22회)
  // ============================================
  const sessions: SessionPlan[] = [
    // ===== Week 1 =====
    {
      date: '2026-02-02', splitType: 'PUSH', duration: 50,
      exercises: {
        'Bench Press':       [{ weight: 60, reps: 7 }, { weight: 60, reps: 6 }],
        'OHP':               [{ weight: 40, reps: 6 }, { weight: 40, reps: 5 }],
        'Shoulder DB Press': [{ weight: 16, reps: 10 }, { weight: 16, reps: 10 }, { weight: 16, reps: 9 }, { weight: 16, reps: 8 }],
      },
    },
    {
      date: '2026-02-03', splitType: 'PULL', duration: 55,
      exercises: {
        'Pull-up':        [{ weight: 0, reps: 7 }, { weight: 0, reps: 6 }],
        'Barbell Row':    [{ weight: 50, reps: 7 }, { weight: 50, reps: 7 }],
        'Lat Pulldown':   [{ weight: 40, reps: 10 }, { weight: 40, reps: 9 }],
        'One-arm DB Row': [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }],
      },
    },
    {
      date: '2026-02-04', splitType: 'LEG', duration: 60,
      exercises: {
        'Squat':                  [{ weight: 70, reps: 6 }, { weight: 70, reps: 5 }],
        'Deadlift':               [{ weight: 80, reps: 6 }, { weight: 80, reps: 5 }],
        'Bulgarian Split Squat':  [{ weight: 12, reps: 10 }, { weight: 12, reps: 9 }],
        'Hip Thrust':             [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }],
      },
    },
    {
      date: '2026-02-06', splitType: 'PUSH', duration: 52,
      exercises: {
        'Bench Press':       [{ weight: 60, reps: 8 }, { weight: 60, reps: 7 }],
        'OHP':               [{ weight: 40, reps: 7 }, { weight: 40, reps: 6 }],
        'Shoulder DB Press': [{ weight: 16, reps: 11 }, { weight: 16, reps: 10 }, { weight: 16, reps: 9 }, { weight: 16, reps: 8 }],
      },
    },
    {
      date: '2026-02-07', splitType: 'PULL', duration: 50,
      exercises: {
        'Pull-up':        [{ weight: 0, reps: 8 }, { weight: 0, reps: 7 }],
        'Barbell Row':    [{ weight: 50, reps: 8 }, { weight: 50, reps: 7 }],
        'Lat Pulldown':   [{ weight: 40, reps: 11 }, { weight: 40, reps: 10 }],
        'One-arm DB Row': [{ weight: 20, reps: 11 }, { weight: 20, reps: 10 }],
      },
    },

    // ===== Week 2 =====
    {
      date: '2026-02-09', splitType: 'LEG', duration: 58,
      exercises: {
        'Squat':                  [{ weight: 70, reps: 7 }, { weight: 70, reps: 7 }],
        'Deadlift':               [{ weight: 80, reps: 7 }, { weight: 80, reps: 6 }],
        'Bulgarian Split Squat':  [{ weight: 12, reps: 11 }, { weight: 12, reps: 10 }],
        'Hip Thrust':             [{ weight: 60, reps: 11 }, { weight: 60, reps: 11 }],
      },
    },
    {
      date: '2026-02-10', splitType: 'PUSH', duration: 48,
      exercises: {
        'Bench Press':       [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }],
        'OHP':               [{ weight: 40, reps: 7 }, { weight: 40, reps: 7 }],
        'Shoulder DB Press': [{ weight: 16, reps: 12 }, { weight: 16, reps: 11 }, { weight: 16, reps: 10 }, { weight: 16, reps: 9 }],
      },
    },
    {
      date: '2026-02-11', splitType: 'PULL', duration: 53,
      exercises: {
        'Pull-up':        [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }],
        'Barbell Row':    [{ weight: 50, reps: 8 }, { weight: 50, reps: 8 }],
        'Lat Pulldown':   [{ weight: 40, reps: 12 }, { weight: 40, reps: 11 }],
        'One-arm DB Row': [{ weight: 20, reps: 12 }, { weight: 20, reps: 11 }],
      },
    },
    {
      date: '2026-02-13', splitType: 'LEG', duration: 62,
      exercises: {
        'Squat':                  [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }],
        'Deadlift':               [{ weight: 80, reps: 8 }, { weight: 80, reps: 7 }],
        'Bulgarian Split Squat':  [{ weight: 12, reps: 12 }, { weight: 12, reps: 12 }],
        'Hip Thrust':             [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }],
      },
    },
    {
      date: '2026-02-14', splitType: 'PUSH', duration: 55,
      exercises: {
        'Bench Press':       [{ weight: 65, reps: 6 }, { weight: 65, reps: 5 }],
        'OHP':               [{ weight: 40, reps: 8 }, { weight: 40, reps: 7 }],
        'Shoulder DB Press': [{ weight: 16, reps: 12 }, { weight: 16, reps: 12 }, { weight: 16, reps: 11 }, { weight: 16, reps: 10 }],
      },
    },

    // ===== Week 3 =====
    {
      date: '2026-02-16', splitType: 'PULL', duration: 55,
      exercises: {
        'Pull-up':        [{ weight: 5, reps: 5 }, { weight: 5, reps: 5 }],
        'Barbell Row':    [{ weight: 55, reps: 6 }, { weight: 55, reps: 6 }],
        'Lat Pulldown':   [{ weight: 40, reps: 12 }, { weight: 40, reps: 12 }],
        'One-arm DB Row': [{ weight: 20, reps: 12 }, { weight: 20, reps: 12 }],
      },
    },
    {
      date: '2026-02-17', splitType: 'LEG', duration: 60,
      exercises: {
        'Squat':                  [{ weight: 75, reps: 6 }, { weight: 75, reps: 5 }],
        'Deadlift':               [{ weight: 85, reps: 6 }, { weight: 85, reps: 5 }],
        'Bulgarian Split Squat':  [{ weight: 14, reps: 9 }, { weight: 14, reps: 8 }],
        'Hip Thrust':             [{ weight: 70, reps: 9 }, { weight: 70, reps: 8 }],
      },
    },
    {
      date: '2026-02-19', splitType: 'PUSH', duration: 50,
      exercises: {
        'Bench Press':       [{ weight: 65, reps: 7 }, { weight: 65, reps: 6 }],
        'OHP':               [{ weight: 40, reps: 8 }, { weight: 40, reps: 8 }],
        'Shoulder DB Press': [{ weight: 18, reps: 9 }, { weight: 18, reps: 8 }, { weight: 18, reps: 8 }, { weight: 18, reps: 7 }],
      },
    },
    {
      date: '2026-02-20', splitType: 'PULL', duration: 50,
      exercises: {
        'Pull-up':        [{ weight: 5, reps: 6 }, { weight: 5, reps: 6 }],
        'Barbell Row':    [{ weight: 55, reps: 7 }, { weight: 55, reps: 7 }],
        'Lat Pulldown':   [{ weight: 42.5, reps: 10 }, { weight: 42.5, reps: 9 }],
        'One-arm DB Row': [{ weight: 22, reps: 10 }, { weight: 22, reps: 9 }],
      },
    },
    {
      date: '2026-02-21', splitType: 'LEG', duration: 58,
      exercises: {
        'Squat':                  [{ weight: 75, reps: 7 }, { weight: 75, reps: 7 }],
        'Deadlift':               [{ weight: 85, reps: 7 }, { weight: 85, reps: 6 }],
        'Bulgarian Split Squat':  [{ weight: 14, reps: 10 }, { weight: 14, reps: 10 }],
        'Hip Thrust':             [{ weight: 70, reps: 10 }, { weight: 70, reps: 10 }],
      },
    },

    // ===== Week 4 =====
    {
      date: '2026-02-23', splitType: 'PUSH', duration: 52,
      exercises: {
        'Bench Press':       [{ weight: 65, reps: 8 }, { weight: 65, reps: 8 }],
        'OHP':               [{ weight: 42.5, reps: 6 }, { weight: 42.5, reps: 5 }],
        'Shoulder DB Press': [{ weight: 18, reps: 10 }, { weight: 18, reps: 10 }, { weight: 18, reps: 9 }, { weight: 18, reps: 8 }],
      },
    },
    {
      date: '2026-02-24', splitType: 'PULL', duration: 53,
      exercises: {
        'Pull-up':        [{ weight: 5, reps: 7 }, { weight: 5, reps: 7 }],
        'Barbell Row':    [{ weight: 55, reps: 8 }, { weight: 55, reps: 8 }],
        'Lat Pulldown':   [{ weight: 42.5, reps: 11 }, { weight: 42.5, reps: 10 }],
        'One-arm DB Row': [{ weight: 22, reps: 11 }, { weight: 22, reps: 10 }],
      },
    },
    {
      date: '2026-02-25', splitType: 'LEG', duration: 60,
      exercises: {
        'Squat':                  [{ weight: 75, reps: 8 }, { weight: 75, reps: 8 }],
        'Deadlift':               [{ weight: 85, reps: 8 }, { weight: 85, reps: 7 }],
        'Bulgarian Split Squat':  [{ weight: 14, reps: 11 }, { weight: 14, reps: 11 }],
        'Hip Thrust':             [{ weight: 70, reps: 11 }, { weight: 70, reps: 11 }],
      },
    },
    {
      date: '2026-02-27', splitType: 'PUSH', duration: 55,
      exercises: {
        'Bench Press':       [{ weight: 70, reps: 5 }, { weight: 70, reps: 5 }],
        'OHP':               [{ weight: 42.5, reps: 7 }, { weight: 42.5, reps: 6 }],
        'Shoulder DB Press': [{ weight: 18, reps: 11 }, { weight: 18, reps: 10 }, { weight: 18, reps: 9 }, { weight: 18, reps: 8 }],
      },
    },
    {
      date: '2026-02-28', splitType: 'PULL', duration: 50,
      exercises: {
        'Pull-up':        [{ weight: 5, reps: 8 }, { weight: 5, reps: 7 }],
        'Barbell Row':    [{ weight: 60, reps: 6 }, { weight: 60, reps: 5 }],
        'Lat Pulldown':   [{ weight: 42.5, reps: 12 }, { weight: 42.5, reps: 11 }],
        'One-arm DB Row': [{ weight: 22, reps: 12 }, { weight: 22, reps: 11 }],
      },
    },

    // ===== Week 5 (현재 주) =====
    {
      date: '2026-03-02', splitType: 'LEG', duration: 63,
      exercises: {
        'Squat':                  [{ weight: 80, reps: 5 }, { weight: 80, reps: 5 }],
        'Deadlift':               [{ weight: 90, reps: 5 }, { weight: 90, reps: 5 }],
        'Bulgarian Split Squat':  [{ weight: 14, reps: 12 }, { weight: 14, reps: 12 }],
        'Hip Thrust':             [{ weight: 70, reps: 12 }, { weight: 70, reps: 12 }],
      },
    },
    {
      date: '2026-03-03', splitType: 'PUSH', duration: 50,
      exercises: {
        'Bench Press':       [{ weight: 70, reps: 6 }, { weight: 70, reps: 6 }],
        'OHP':               [{ weight: 42.5, reps: 8 }, { weight: 42.5, reps: 7 }],
        'Shoulder DB Press': [{ weight: 18, reps: 12 }, { weight: 18, reps: 11 }, { weight: 18, reps: 10 }, { weight: 18, reps: 9 }],
      },
    },
  ]

  // Create all lift sessions
  let liftCount = 0
  let setCount = 0

  for (const s of sessions) {
    const activity = await prisma.activity.create({
      data: { date: new Date(s.date), type: 'LIFT' },
    })

    const session = await prisma.liftSession.create({
      data: {
        activityId: activity.id,
        splitType: s.splitType,
        date: new Date(s.date),
        duration: s.duration,
      },
    })

    let order = 0
    for (const [exName, sets] of Object.entries(s.exercises)) {
      const exercise = ex[exName]
      if (!exercise) throw new Error(`Exercise not found: ${exName}`)

      const log = await prisma.exerciseLog.create({
        data: { sessionId: session.id, exerciseId: exercise.id, order },
      })

      await prisma.exerciseSet.createMany({
        data: sets.map((set, i) => ({
          exerciseLogId: log.id,
          setNumber: i + 1,
          weight: set.weight,
          reps: set.reps,
        })),
      })

      setCount += sets.length
      order++
    }
    liftCount++
  }

  console.log(`✅ ${liftCount}개 LiftSession, ${setCount}개 ExerciseSet 생성`)

  // ============================================
  // 러닝 세션 (5주치, 주 2-3회)
  // ============================================
  const runData: { date: string; distanceKm: number; durationSec: number; avgPace: number; rpe: number; runType: string; notes?: string }[] = [
    { date: '2026-02-02', distanceKm: 5.0,  durationSec: 1850, avgPace: 370, rpe: 5, runType: 'EASY', notes: '리프팅 후 가벼운 런' },
    { date: '2026-02-05', distanceKm: 6.0,  durationSec: 2100, avgPace: 350, rpe: 6, runType: 'EASY' },
    { date: '2026-02-08', distanceKm: 8.0,  durationSec: 2880, avgPace: 360, rpe: 6, runType: 'LONG' },
    { date: '2026-02-10', distanceKm: 5.0,  durationSec: 1750, avgPace: 350, rpe: 5, runType: 'EASY' },
    { date: '2026-02-12', distanceKm: 6.0,  durationSec: 1980, avgPace: 330, rpe: 7, runType: 'TEMPO' },
    { date: '2026-02-15', distanceKm: 10.0, durationSec: 3600, avgPace: 360, rpe: 6.5, runType: 'LONG' },
    { date: '2026-02-18', distanceKm: 5.0,  durationSec: 1800, avgPace: 360, rpe: 5, runType: 'RECOVERY' },
    { date: '2026-02-20', distanceKm: 6.0,  durationSec: 1920, avgPace: 320, rpe: 7.5, runType: 'TEMPO' },
    { date: '2026-02-22', distanceKm: 12.0, durationSec: 4320, avgPace: 360, rpe: 7, runType: 'LONG' },
    { date: '2026-02-25', distanceKm: 5.0,  durationSec: 1750, avgPace: 350, rpe: 5, runType: 'EASY' },
    { date: '2026-02-26', distanceKm: 7.0,  durationSec: 2240, avgPace: 320, rpe: 7, runType: 'TEMPO' },
    { date: '2026-03-01', distanceKm: 14.0, durationSec: 5040, avgPace: 360, rpe: 7, runType: 'LONG', notes: '첫 14k 롱런' },
    { date: '2026-03-03', distanceKm: 5.0,  durationSec: 1900, avgPace: 380, rpe: 4, runType: 'RECOVERY', notes: '리커버리' },
  ]

  for (const r of runData) {
    const activity = await prisma.activity.create({
      data: { date: new Date(r.date), type: 'RUN' },
    })
    await prisma.runSession.create({
      data: {
        activityId: activity.id,
        date: new Date(r.date),
        distanceKm: r.distanceKm,
        durationSec: r.durationSec,
        avgPace: r.avgPace,
        rpe: r.rpe,
        runType: r.runType as any,
        notes: r.notes || null,
      },
    })
  }

  console.log(`✅ ${runData.length}개 RunSession 생성`)

  // ============================================
  // 바디 로그
  // ============================================
  const bodyData = [
    { date: '2026-02-02', weight: 75.2 },
    { date: '2026-02-06', weight: 75.0 },
    { date: '2026-02-09', weight: 74.8 },
    { date: '2026-02-13', weight: 74.6 },
    { date: '2026-02-16', weight: 74.9 },
    { date: '2026-02-20', weight: 74.5 },
    { date: '2026-02-23', weight: 74.3 },
    { date: '2026-02-27', weight: 74.1 },
    { date: '2026-03-02', weight: 74.0 },
  ]

  for (const b of bodyData) {
    await prisma.bodyLog.create({
      data: { date: new Date(b.date), weight: b.weight },
    })
  }

  console.log(`✅ ${bodyData.length}개 BodyLog 생성`)
  console.log('\n🎉 시드 완료!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
