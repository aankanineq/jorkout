'use server'

import { prisma } from '@/lib/prisma'
import { todayKST } from '@/lib/date'
import { DEFAULT_LOAD_TABLE } from '@/lib/fatigueDefaults'

type FatigueState = { push: number; pull: number; quad: number; post: number; cardio: number }
type FatigueZone = keyof FatigueState

async function getLoadTable(): Promise<Record<string, FatigueState>> {
  const configs = await prisma.liftConfig.findMany()
  const table = { ...DEFAULT_LOAD_TABLE }
  for (const c of configs) {
    if (c.fatigueLoad) {
      table[c.liftType] = c.fatigueLoad as FatigueState
    }
  }
  return table
}


function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function getActivityKey(activity: { type: string; liftSession?: { liftType: string } | null; runSession?: { runType: string } | null; sportSession?: { sportType: string } | null }): string {
  if (activity.type === 'LIFT' && activity.liftSession) return activity.liftSession.liftType
  if (activity.type === 'RUN' && activity.runSession) return activity.runSession.runType
  if (activity.type === 'SPORT' && activity.sportSession) return activity.sportSession.sportType
  return activity.type // REST
}

export async function getFatigueState(): Promise<FatigueState> {
  const now = new Date()
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const [activities, loadTable] = await Promise.all([
    prisma.activity.findMany({
      where: { date: { gte: fourteenDaysAgo }, isBackfill: false },
      include: { liftSession: true, runSession: true, sportSession: true },
      orderBy: { date: 'asc' },
    }),
    getLoadTable(),
  ])

  const fatigue: FatigueState = { push: 0, pull: 0, quad: 0, post: 0, cardio: 0 }

  for (const act of activities) {
    const key = getActivityKey(act)
    const load = loadTable[key] || loadTable.REST
    const daysAgo = Math.floor((now.getTime() - new Date(act.date).getTime()) / (1000 * 60 * 60 * 24))
    const decay = daysAgo // -1 per day

    for (const zone of Object.keys(fatigue) as FatigueZone[]) {
      const contribution = Math.max(0, load[zone] - decay)
      fatigue[zone] += contribution
    }

    // REST gives extra -1 on that day (already 0 load, so we subtract from total)
    if (act.type === 'REST') {
      for (const zone of Object.keys(fatigue) as FatigueZone[]) {
        fatigue[zone] = Math.max(0, fatigue[zone] - Math.max(0, 1 - decay))
      }
    }
  }

  // Apply overrides
  const today = todayKST()
  const overrides = await prisma.fatigueOverride.findMany({
    where: { date: today },
  })

  for (const o of overrides) {
    const zone = o.zone.toLowerCase() as FatigueZone
    if (zone in fatigue) {
      fatigue[zone] = o.value
    }
  }

  // Clamp all to 0-6
  for (const zone of Object.keys(fatigue) as FatigueZone[]) {
    fatigue[zone] = clamp(fatigue[zone], 0, 6)
  }

  return fatigue
}

export async function adjustFatigue(zone: string, value: number) {
  const today = todayKST()
  const clamped = clamp(value, 0, 6)

  await prisma.fatigueOverride.upsert({
    where: { date_zone: { date: today, zone: zone.toUpperCase() } },
    create: { date: today, zone: zone.toUpperCase(), value: clamped },
    update: { value: clamped, updatedAt: new Date() },
  })
}

export async function getRecommendation() {
  const [fatigue, loadTable, enabledConfigs] = await Promise.all([
    getFatigueState(),
    getLoadTable(),
    prisma.liftConfig.findMany({ where: { enabled: true }, select: { liftType: true } }),
  ])
  const enabledLifts = enabledConfigs.map(c => c.liftType) as ('BENCH' | 'SQUAT' | 'OHP' | 'DEAD')[]

  // Last lift type
  const lastLift = await prisma.liftSession.findFirst({
    where: { activity: { isBackfill: false } },
    orderBy: { date: 'desc' },
    select: { liftType: true },
  })

  // Last run type
  const lastRun = await prisma.runSession.findFirst({
    where: { activity: { isBackfill: false } },
    orderBy: { date: 'desc' },
    select: { runType: true },
  })

  // Check consecutive activity days
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const recentActivities = await prisma.activity.findMany({
    where: { date: { gte: threeDaysAgo }, type: { not: 'REST' }, isBackfill: false },
  })

  const allHigh = Object.values(fatigue).every((v) => v >= 4)
  const consecutiveDays = recentActivities.length >= 3

  // REST recommendation
  if (allHigh || consecutiveDays) {
    const alternatives = []
    if (fatigue.cardio <= 2) {
      alternatives.push({ type: 'RUN' as const, subType: 'EASY', reason: 'CARDIO 여유' })
    }
    return {
      primary: { type: 'REST' as const, reason: allHigh ? '전체 피로 높음' : '3일 연속 활동' },
      alternatives,
      fatigue,
    }
  }

  // Lift recommendation — enabled만 대상
  if (enabledLifts.length === 0) {
    // 리프트 없으면 런/스포츠만
    const alternatives: { type: 'LIFT' | 'RUN' | 'SPORT' | 'REST'; subType?: string; reason: string }[] = []
    let runType: 'EASY' | 'QUALITY' | 'LONG' = 'EASY'
    if (lastRun) {
      if (lastRun.runType === 'EASY') runType = 'QUALITY'
      else if (lastRun.runType === 'QUALITY') runType = 'LONG'
      else runType = 'EASY'
    }
    alternatives.push({ type: 'RUN', subType: runType, reason: `CARDIO ${fatigue.cardio}/6` })
    alternatives.push({ type: 'SPORT', reason: '스포츠 기록' })
    alternatives.push({ type: 'REST', reason: '휴식' })
    return {
      primary: { type: 'REST' as const, reason: '활성 리프트 없음' },
      alternatives,
      fatigue,
    }
  }

  // 피로도 점수로 모든 enabled 리프트 정렬
  const liftScores = enabledLifts.map(t => {
    const load = loadTable[t] || loadTable.REST
    const score = (Object.keys(load) as FatigueZone[]).reduce((sum, z) => sum + load[z] * fatigue[z], 0)
    return { liftType: t, score }
  })
  liftScores.sort((a, b) => a.score - b.score) // 낮을수록 추천 (피로 적은 곳)

  // 마지막으로 한 운동은 후순위로
  let bestIdx = 0
  if (lastLift && liftScores.length > 1 && liftScores[0].liftType === lastLift.liftType) {
    bestIdx = 1
  }
  const liftType = liftScores[bestIdx].liftType

  // Get cycle info
  const config = await prisma.liftConfig.findUnique({ where: { liftType } })
  const weekLabel = config ? { FIVE: '5s', THREE: '3s', ONE: '1s', DELOAD: 'DEL' }[config.cycleWeek] : ''

  const primary = {
    type: 'LIFT' as const,
    subType: liftType,
    reason: `피로 최소 · ${weekLabel} week`,
  }

  // Alternatives
  const alternatives: { type: 'LIFT' | 'RUN' | 'SPORT' | 'REST'; subType?: string; reason: string }[] = []

  // 나머지 enabled 리프트
  for (const ls of liftScores) {
    if (ls.liftType !== liftType) {
      alternatives.push({ type: 'LIFT' as const, subType: ls.liftType, reason: ls.liftType })
    }
  }

  // Run
  let runType: 'EASY' | 'QUALITY' | 'LONG' = 'EASY'
  if (lastRun) {
    if (lastRun.runType === 'EASY') runType = 'QUALITY'
    else if (lastRun.runType === 'QUALITY') runType = 'LONG'
    else runType = 'EASY'
  }
  if (fatigue.quad + fatigue.post >= 6) runType = 'EASY'
  alternatives.push({ type: 'RUN', subType: runType, reason: `CARDIO ${fatigue.cardio}/6` })

  alternatives.push({ type: 'SPORT', reason: '스포츠 기록' })
  alternatives.push({ type: 'REST', reason: '휴식' })

  return { primary, alternatives, fatigue }
}
