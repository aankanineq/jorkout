'use server'

import { prisma } from '@/lib/prisma'
import { LiftType, CycleWeek } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// 5kg 단위 반올림
function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

// 5/3/1 무게 퍼센트
const PERCENTAGES: Record<CycleWeek, [number, number, number]> = {
  FIVE:  [0.65, 0.75, 0.85],
  THREE: [0.70, 0.80, 0.90],
  ONE:   [0.75, 0.85, 0.95],
}

const REPS: Record<CycleWeek, [number, number, string]> = {
  FIVE:  [5, 5, '5+'],
  THREE: [3, 3, '3+'],
  ONE:   [5, 3, '1+'],
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
    weekLabel: { FIVE: '5s', THREE: '3s', ONE: '1s' }[config.cycleWeek],
  }
}

export async function getAllLiftConfigs() {
  const configs = await prisma.liftConfig.findMany()
  return configs.map((c) => ({
    ...c,
    weekLabel: { FIVE: '5s', THREE: '3s', ONE: '1s' }[c.cycleWeek],
  }))
}

export async function advanceCycle(liftType: LiftType) {
  const config = await prisma.liftConfig.findUniqueOrThrow({
    where: { liftType },
  })

  const order: CycleWeek[] = ['FIVE', 'THREE', 'ONE']
  const idx = order.indexOf(config.cycleWeek)
  const nextIdx = (idx + 1) % order.length

  const update: { cycleWeek: CycleWeek; tm?: number } = {
    cycleWeek: order[nextIdx],
  }

  // ONE 완료 → TM 증가
  if (config.cycleWeek === 'ONE') {
    update.tm = config.tm + config.tmIncrement
  }

  await prisma.liftConfig.update({
    where: { liftType },
    data: update,
  })

  revalidatePath('/')
}

export async function updateTM(liftType: LiftType, newTM: number) {
  await prisma.liftConfig.update({
    where: { liftType },
    data: { tm: newTM },
  })
  revalidatePath('/')
  revalidatePath('/settings')
}
