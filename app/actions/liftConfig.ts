'use server'

import { prisma } from '@/lib/prisma'
import { LiftType, CycleWeek } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// 2.5kg 단위 반올림
function roundTo2_5(n: number): number {
  return Math.round(n / 2.5) * 2.5
}

// 5kg 단위 반올림
function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

// AMRAP 렙 수 기반 TM 조정량 계산
// 0-1렙: TM × 0.9 (10% 감량) → delta로 반환
// 2렙: +0kg (유지)
// 3-4렙: +tmIncrement (기본)
// 5+렙: +tmIncrement × 2 (빠른 진행)
function calcAmrapTMDelta(amrapReps: number, currentTM: number, tmIncrement: number): number {
  if (amrapReps <= 1) return roundTo2_5(currentTM * 0.9) - currentTM // ~-10%
  if (amrapReps === 2) return 0
  if (amrapReps <= 4) return tmIncrement
  return tmIncrement * 2 // 5+
}

// 5/3/1 무게 퍼센트
const PERCENTAGES: Record<CycleWeek, [number, number, number]> = {
  FIVE:   [0.65, 0.75, 0.85],
  THREE:  [0.70, 0.80, 0.90],
  ONE:    [0.75, 0.85, 0.95],
  DELOAD: [0.40, 0.50, 0.60],
}

const REPS: Record<CycleWeek, [number, number, string | number]> = {
  FIVE:   [5, 5, '5+'],
  THREE:  [3, 3, '3+'],
  ONE:    [5, 3, '1+'],
  DELOAD: [5, 5, 5],
}

export async function getLiftConfig(liftType: LiftType) {
  const config = await prisma.liftConfig.findUniqueOrThrow({
    where: { liftType },
  })

  const pcts = PERCENTAGES[config.cycleWeek]
  const reps = REPS[config.cycleWeek]

  const mainSets = pcts.map((pct, i) => ({
    weight: roundTo5(config.tm * pct),
    reps: reps[i],
    percentage: Math.round(pct * 100),
  }))

  const bbbWeight = roundTo5(config.tm * 0.5)

  return {
    ...config,
    mainSets,
    bbbWeight,
    weekLabel: { FIVE: '5s', THREE: '3s', ONE: '1s', DELOAD: 'DEL' }[config.cycleWeek],
    isDeload: config.cycleWeek === 'DELOAD',
  }
}

export async function getAllLiftConfigs() {
  const configs = await prisma.liftConfig.findMany()
  return configs.map((c) => ({
    ...c,
    weekLabel: { FIVE: '5s', THREE: '3s', ONE: '1s', DELOAD: 'DEL' }[c.cycleWeek],
  }))
}

export async function advanceCycle(liftType: LiftType) {
  const config = await prisma.liftConfig.findUniqueOrThrow({
    where: { liftType },
  })

  const order: CycleWeek[] = ['FIVE', 'THREE', 'ONE', 'DELOAD']
  const idx = order.indexOf(config.cycleWeek)
  const nextIdx = (idx + 1) % order.length

  const update: { cycleWeek: CycleWeek; tm?: number } = {
    cycleWeek: order[nextIdx],
  }

  // DELOAD 완료 → AMRAP 기반 TM 조정 (새 사이클 시작)
  if (config.cycleWeek === 'DELOAD') {
    // 가장 최근 ONE 주차의 AMRAP 세트 조회
    const amrapSet = await prisma.exerciseSet.findFirst({
      where: {
        isAmrap: true,
        exerciseLog: {
          exercise: { role: 'MAIN', liftType },
          liftSession: { completed: true, activity: { isBackfill: false } },
        },
      },
      orderBy: { exerciseLog: { liftSession: { date: 'desc' } } },
    })

    if (amrapSet) {
      const delta = calcAmrapTMDelta(amrapSet.reps, config.tm, config.tmIncrement)
      update.tm = roundTo2_5(config.tm + delta)
    } else {
      // AMRAP 기록 없으면 기본 증가
      update.tm = config.tm + config.tmIncrement
    }
  }

  await prisma.liftConfig.update({
    where: { liftType },
    data: update,
  })

  revalidatePath('/')
}

export async function revertCycle(liftType: LiftType) {
  const config = await prisma.liftConfig.findUniqueOrThrow({
    where: { liftType },
  })

  const order: CycleWeek[] = ['FIVE', 'THREE', 'ONE', 'DELOAD']
  const idx = order.indexOf(config.cycleWeek)
  const prevIdx = (idx - 1 + order.length) % order.length

  await prisma.liftConfig.update({
    where: { liftType },
    data: { cycleWeek: order[prevIdx] },
  })

  revalidatePath('/')
}

export async function updateCycleWeek(liftType: LiftType, cycleWeek: CycleWeek) {
  await prisma.liftConfig.update({
    where: { liftType },
    data: { cycleWeek },
  })
  revalidatePath('/')
  revalidatePath('/settings')
  revalidatePath('/history')
}

export async function updateTM(liftType: LiftType, newTM: number) {
  await prisma.liftConfig.update({
    where: { liftType },
    data: { tm: newTM },
  })
  revalidatePath('/')
  revalidatePath('/settings')
}
