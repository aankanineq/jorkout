import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

async function main() {
  // 운동 목록 조회
  const exercises = await prisma.exercise.findMany()
  const byLift = (lt: string) => exercises.filter((e) => e.liftType === lt)

  // === Day 10: Bench Day ===
  const a1 = await prisma.activity.create({
    data: {
      date: daysAgo(10), type: 'LIFT',
      liftSession: {
        create: {
          liftType: 'BENCH', date: daysAgo(10), duration: 52,
          exerciseLogs: {
            create: byLift('BENCH').filter(e => e.role !== 'BBB').map((ex, i) => ({
              exerciseId: ex.id, order: i,
              sets: {
                create: ex.role === 'MAIN'
                  ? [
                      { setNumber: 1, weight: 40, reps: 5 },
                      { setNumber: 2, weight: 45, reps: 5 },
                      { setNumber: 3, weight: 50, reps: 8 },
                      // BBB sets
                      { setNumber: 4, weight: 30, reps: 10 },
                      { setNumber: 5, weight: 30, reps: 10 },
                      { setNumber: 6, weight: 30, reps: 10 },
                      { setNumber: 7, weight: 30, reps: 10 },
                      { setNumber: 8, weight: 30, reps: 10 },
                    ]
                  : ex.name === '바벨로우'
                  ? [
                      { setNumber: 1, weight: 45, reps: 10 },
                      { setNumber: 2, weight: 45, reps: 9 },
                      { setNumber: 3, weight: 45, reps: 8 },
                      { setNumber: 4, weight: 45, reps: 8 },
                    ]
                  : ex.name === '인클라인 DB프레스'
                  ? [
                      { setNumber: 1, weight: 18, reps: 12 },
                      { setNumber: 2, weight: 18, reps: 10 },
                      { setNumber: 3, weight: 18, reps: 10 },
                    ]
                  : [
                      { setNumber: 1, weight: 15, reps: 20 },
                      { setNumber: 2, weight: 15, reps: 18 },
                      { setNumber: 3, weight: 15, reps: 15 },
                    ],
              },
            })),
          },
        },
      },
    },
  })

  // === Day 9: Easy Run ===
  await prisma.activity.create({
    data: {
      date: daysAgo(9), type: 'RUN',
      runSession: {
        create: {
          date: daysAgo(9), runType: 'EASY',
          distanceKm: 5.2, durationSec: 1716, avgPace: 330,
        },
      },
    },
  })

  // === Day 8: Squat Day ===
  await prisma.activity.create({
    data: {
      date: daysAgo(8), type: 'LIFT',
      liftSession: {
        create: {
          liftType: 'SQUAT', date: daysAgo(8), duration: 48,
          exerciseLogs: {
            create: byLift('SQUAT').filter(e => e.role !== 'BBB').map((ex, i) => ({
              exerciseId: ex.id, order: i,
              sets: {
                create: ex.role === 'MAIN'
                  ? [
                      { setNumber: 1, weight: 50, reps: 5 },
                      { setNumber: 2, weight: 60, reps: 5 },
                      { setNumber: 3, weight: 70, reps: 7 },
                      { setNumber: 4, weight: 40, reps: 10 },
                      { setNumber: 5, weight: 40, reps: 10 },
                      { setNumber: 6, weight: 40, reps: 10 },
                      { setNumber: 7, weight: 40, reps: 10 },
                      { setNumber: 8, weight: 40, reps: 10 },
                    ]
                  : ex.name === 'RDL'
                  ? [
                      { setNumber: 1, weight: 60, reps: 10 },
                      { setNumber: 2, weight: 60, reps: 9 },
                      { setNumber: 3, weight: 60, reps: 8 },
                    ]
                  : ex.name.includes('불가리안')
                  ? [
                      { setNumber: 1, weight: 14, reps: 10 },
                      { setNumber: 2, weight: 14, reps: 9 },
                      { setNumber: 3, weight: 14, reps: 8 },
                    ]
                  : [
                      { setNumber: 1, weight: 40, reps: 20 },
                      { setNumber: 2, weight: 40, reps: 18 },
                      { setNumber: 3, weight: 40, reps: 15 },
                    ],
              },
            })),
          },
        },
      },
    },
  })

  // === Day 7: REST ===
  await prisma.activity.create({
    data: { date: daysAgo(7), type: 'REST' },
  })

  // === Day 6: OHP Day ===
  await prisma.activity.create({
    data: {
      date: daysAgo(6), type: 'LIFT',
      liftSession: {
        create: {
          liftType: 'OHP', date: daysAgo(6), duration: 50,
          exerciseLogs: {
            create: byLift('OHP').filter(e => e.role !== 'BBB').map((ex, i) => ({
              exerciseId: ex.id, order: i,
              sets: {
                create: ex.role === 'MAIN'
                  ? [
                      { setNumber: 1, weight: 25, reps: 5 },
                      { setNumber: 2, weight: 30, reps: 5 },
                      { setNumber: 3, weight: 35, reps: 6 },
                      { setNumber: 4, weight: 20, reps: 10 },
                      { setNumber: 5, weight: 20, reps: 10 },
                      { setNumber: 6, weight: 20, reps: 10 },
                      { setNumber: 7, weight: 20, reps: 10 },
                      { setNumber: 8, weight: 20, reps: 10 },
                    ]
                  : ex.name === '풀업'
                  ? [
                      { setNumber: 1, weight: 0, reps: 8 },
                      { setNumber: 2, weight: 0, reps: 8 },
                      { setNumber: 3, weight: 0, reps: 7 },
                      { setNumber: 4, weight: 0, reps: 6 },
                    ]
                  : ex.name.includes('레터럴')
                  ? [
                      { setNumber: 1, weight: 10, reps: 15 },
                      { setNumber: 2, weight: 10, reps: 13 },
                      { setNumber: 3, weight: 10, reps: 12 },
                    ]
                  : [
                      { setNumber: 1, weight: 10, reps: 15 },
                      { setNumber: 2, weight: 10, reps: 13 },
                      { setNumber: 3, weight: 10, reps: 12 },
                    ],
              },
            })),
          },
        },
      },
    },
  })

  // === Day 5: Quality Run ===
  await prisma.activity.create({
    data: {
      date: daysAgo(5), type: 'RUN',
      runSession: {
        create: {
          date: daysAgo(5), runType: 'QUALITY',
          distanceKm: 6.0, durationSec: 1800, avgPace: 300,
        },
      },
    },
  })

  // === Day 4: Dead Day ===
  await prisma.activity.create({
    data: {
      date: daysAgo(4), type: 'LIFT',
      liftSession: {
        create: {
          liftType: 'DEAD', date: daysAgo(4), duration: 45,
          exerciseLogs: {
            create: byLift('DEAD').filter(e => e.role !== 'BBB').map((ex, i) => ({
              exerciseId: ex.id, order: i,
              sets: {
                create: ex.role === 'MAIN'
                  ? [
                      { setNumber: 1, weight: 65, reps: 5 },
                      { setNumber: 2, weight: 75, reps: 5 },
                      { setNumber: 3, weight: 85, reps: 6 },
                      { setNumber: 4, weight: 50, reps: 10 },
                      { setNumber: 5, weight: 50, reps: 10 },
                      { setNumber: 6, weight: 50, reps: 10 },
                      { setNumber: 7, weight: 50, reps: 10 },
                      { setNumber: 8, weight: 50, reps: 10 },
                    ]
                  : ex.name.includes('불가리안')
                  ? [
                      { setNumber: 1, weight: 14, reps: 10 },
                      { setNumber: 2, weight: 14, reps: 10 },
                      { setNumber: 3, weight: 14, reps: 9 },
                    ]
                  : ex.name.includes('레그')
                  ? [
                      { setNumber: 1, weight: 30, reps: 12 },
                      { setNumber: 2, weight: 30, reps: 11 },
                      { setNumber: 3, weight: 30, reps: 10 },
                    ]
                  : [
                      { setNumber: 1, weight: 40, reps: 20 },
                      { setNumber: 2, weight: 40, reps: 18 },
                      { setNumber: 3, weight: 40, reps: 15 },
                    ],
              },
            })),
          },
        },
      },
    },
  })

  // === Day 3: Tennis ===
  await prisma.activity.create({
    data: {
      date: daysAgo(3), type: 'SPORT',
      sportSession: {
        create: {
          date: daysAgo(3), sportType: 'TENNIS',
          durationMin: 90, rpe: 7, notes: '더블스 3세트',
        },
      },
    },
  })

  // === Day 2: Long Run ===
  await prisma.activity.create({
    data: {
      date: daysAgo(2), type: 'RUN',
      runSession: {
        create: {
          date: daysAgo(2), runType: 'LONG',
          distanceKm: 10.5, durationSec: 3780, avgPace: 360,
        },
      },
    },
  })

  // === Day 1 (어제): REST ===
  await prisma.activity.create({
    data: { date: daysAgo(1), type: 'REST' },
  })

  // === BodyLog 최근 5일 ===
  const bodyData = [
    { date: daysAgo(8), weight: 76.8, bodyFat: 15.5 },
    { date: daysAgo(6), weight: 76.5, bodyFat: 15.3 },
    { date: daysAgo(4), weight: 76.2, bodyFat: 15.1 },
    { date: daysAgo(2), weight: 76.0, bodyFat: 15.0 },
    { date: daysAgo(0), weight: 75.8, bodyFat: 14.8 },
  ]
  for (const b of bodyData) {
    await prisma.bodyLog.create({ data: b })
  }

  // === LiftConfig 사이클 진행 (더 현실적으로) ===
  await prisma.liftConfig.update({
    where: { liftType: 'BENCH' },
    data: { cycleWeek: 'THREE' }, // 벤치는 이미 5s 완료
  })
  await prisma.liftConfig.update({
    where: { liftType: 'SQUAT' },
    data: { cycleWeek: 'THREE' },
  })
  await prisma.liftConfig.update({
    where: { liftType: 'OHP' },
    data: { cycleWeek: 'THREE' },
  })
  await prisma.liftConfig.update({
    where: { liftType: 'DEAD' },
    data: { cycleWeek: 'THREE' },
  })

  // === Race ===
  await prisma.race.create({
    data: {
      name: '서울 하프마라톤',
      date: new Date('2026-05-17'),
      distanceKm: 21.1,
      goalTime: '1:59:59',
      weeklyTargetKm: 25,
      status: 'UPCOMING',
    },
  })

  console.log('Dummy data inserted: 10 activities + 5 body logs + 1 race')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
