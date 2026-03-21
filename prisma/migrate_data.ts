/**
 * 기존 Jorkout 데이터를 새 스키마(runs, gyms)로 이전하는 스크립트
 *
 * 실행: npx tsx prisma/migrate_data.ts
 *
 * 기존 테이블(activities, run_sessions, lift_sessions 등)은 삭제하지 않음.
 * 이미 runs/gyms에 있는 데이터와 중복 삽입되지 않도록 주의.
 */

import 'dotenv/config'
import pg from 'pg'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 마이그레이션 시작...\n')

  // ──────────────────────────────────────────────
  // 1. RUN 데이터 이전
  //    run_sessions JOIN activities
  // ──────────────────────────────────────────────
  console.log('📍 RunSession → runs 이전 중...')
  const runResult = await pool.query<{
    date: Date
    distance_km: number
    duration_sec: number
    avg_pace: number
  }>(`
    SELECT
      a.date,
      rs.distance_km,
      rs.duration_sec,
      rs.avg_pace
    FROM run_sessions rs
    JOIN activities a ON a.id = rs.activity_id
    ORDER BY a.date ASC
  `)

  let runCount = 0
  for (const row of runResult.rows) {
    const minutes = Math.ceil(row.duration_sec / 60)
    const km = row.distance_km
    // avg_pace는 초/km 단위 → 분/km으로 변환
    const pace = km > 0 ? minutes / km : null

    await prisma.run.create({
      data: {
        date: row.date,
        km,
        minutes,
        pace,
      },
    })
    runCount++
  }
  console.log(`  ✓ ${runCount}개 러닝 기록 이전 완료\n`)

  // ──────────────────────────────────────────────
  // 2. GYM 데이터 이전
  //    lift_sessions JOIN exercise_logs JOIN exercise_sets JOIN exercises
  //    같은 exercise_log 내 같은 무게 세트를 묶어서 1개 Gym 레코드로
  // ──────────────────────────────────────────────
  console.log('📍 LiftSession → gyms 이전 중...')
  const gymResult = await pool.query<{
    date: Date
    exercise_name: string
    weight: number
    reps: number
    set_count: number
  }>(`
    SELECT
      a.date,
      e.name AS exercise_name,
      es.weight,
      es.reps,
      COUNT(*) AS set_count
    FROM lift_sessions ls
    JOIN activities a ON a.id = ls.activity_id
    JOIN exercise_logs el ON el.lift_session_id = ls.id
    JOIN exercises e ON e.id = el.exercise_id
    JOIN exercise_sets es ON es.exercise_log_id = el.id
    WHERE es.is_warmup = false
    GROUP BY a.date, e.name, es.weight, es.reps, el.id
    ORDER BY a.date ASC, e.name ASC, es.weight ASC
  `)

  let gymCount = 0
  for (const row of gymResult.rows) {
    const sets = Number(row.set_count)
    const reps = row.reps
    const weight = row.weight
    await prisma.gym.create({
      data: {
        date: row.date,
        exercise: row.exercise_name,
        sets,
        reps,
        weight,
        volume: sets * reps * weight,
        rpe: null,
        memo: null,
        raw: `${sets}x${reps}x${weight}`,
      },
    })
    gymCount++
  }
  console.log(`  ✓ ${gymCount}개 웨이트 세트 이전 완료\n`)

  console.log('✅ 마이그레이션 완료!')
  console.log(`   Run: ${runCount}개, Gym: ${gymCount}개`)
}

main()
  .catch((e) => {
    console.error('❌ 마이그레이션 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
