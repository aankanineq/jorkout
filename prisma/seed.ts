import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // LiftConfig — 4개 리프트 초기 TM + FIVE week
  await prisma.liftConfig.createMany({
    data: [
      { liftType: 'BENCH', tm: 60, cycleWeek: 'FIVE', tmIncrement: 5 },
      { liftType: 'SQUAT', tm: 80, cycleWeek: 'FIVE', tmIncrement: 5 },
      { liftType: 'OHP', tm: 40, cycleWeek: 'FIVE', tmIncrement: 5 },
      { liftType: 'DEAD', tm: 100, cycleWeek: 'FIVE', tmIncrement: 5 },
    ],
  })

  // Exercise 라이브러리 — 4세션 × 4운동
  await prisma.exercise.createMany({
    data: [
      // Bench Day
      { name: '벤치프레스', liftType: 'BENCH', role: 'MAIN', order: 0, targetSets: 3, targetMinReps: 1, targetMaxReps: 5, availableWeights: [] },
      { name: '바벨로우', liftType: 'BENCH', role: 'ACCESSORY', order: 2, targetSets: 4, targetMinReps: 8, targetMaxReps: 10, availableWeights: [30, 35, 40, 45, 50, 55, 60] },
      { name: '인클라인 DB프레스', liftType: 'BENCH', role: 'ACCESSORY', order: 3, targetSets: 3, targetMinReps: 10, targetMaxReps: 12, availableWeights: [14, 16, 18, 20, 22, 24] },
      { name: '페이스풀', liftType: 'BENCH', role: 'ACCESSORY', order: 4, targetSets: 3, targetMinReps: 15, targetMaxReps: 20, availableWeights: [10, 15, 20, 25] },

      // Squat Day
      { name: '스쿼트', liftType: 'SQUAT', role: 'MAIN', order: 0, targetSets: 3, targetMinReps: 1, targetMaxReps: 5, availableWeights: [] },
      { name: 'RDL', liftType: 'SQUAT', role: 'ACCESSORY', order: 2, targetSets: 3, targetMinReps: 8, targetMaxReps: 10, availableWeights: [40, 50, 60, 70, 80] },
      { name: '불가리안 스플릿 스쿼트', liftType: 'SQUAT', role: 'ACCESSORY', order: 3, targetSets: 3, targetMinReps: 8, targetMaxReps: 10, availableWeights: [10, 12, 14, 16, 18, 20] },
      { name: '카프레이즈', liftType: 'SQUAT', role: 'ACCESSORY', order: 4, targetSets: 3, targetMinReps: 15, targetMaxReps: 20, availableWeights: [20, 30, 40, 50, 60] },

      // OHP Day
      { name: 'OHP', liftType: 'OHP', role: 'MAIN', order: 0, targetSets: 3, targetMinReps: 1, targetMaxReps: 5, availableWeights: [] },
      { name: '풀업', liftType: 'OHP', role: 'ACCESSORY', order: 2, targetSets: 4, targetMinReps: 8, targetMaxReps: 10, availableWeights: [0] },
      { name: '사이드 레터럴레이즈', liftType: 'OHP', role: 'ACCESSORY', order: 3, targetSets: 3, targetMinReps: 12, targetMaxReps: 15, availableWeights: [5, 7.5, 10, 12.5, 15] },
      { name: '바이셉 컬', liftType: 'OHP', role: 'ACCESSORY', order: 4, targetSets: 3, targetMinReps: 12, targetMaxReps: 15, availableWeights: [8, 10, 12, 14, 16] },

      // Dead Day
      { name: '데드리프트', liftType: 'DEAD', role: 'MAIN', order: 0, targetSets: 3, targetMinReps: 1, targetMaxReps: 5, availableWeights: [] },
      { name: '불가리안 스플릿 스쿼트 (데드)', liftType: 'DEAD', role: 'ACCESSORY', order: 2, targetSets: 3, targetMinReps: 8, targetMaxReps: 10, availableWeights: [10, 12, 14, 16, 18, 20] },
      { name: '레그 컬', liftType: 'DEAD', role: 'ACCESSORY', order: 3, targetSets: 3, targetMinReps: 10, targetMaxReps: 12, availableWeights: [20, 25, 30, 35, 40] },
      { name: '카프레이즈 (데드)', liftType: 'DEAD', role: 'ACCESSORY', order: 4, targetSets: 3, targetMinReps: 15, targetMaxReps: 20, availableWeights: [20, 30, 40, 50, 60] },
    ],
  })

  console.log('Seed complete: 4 LiftConfigs + 16 Exercises')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
