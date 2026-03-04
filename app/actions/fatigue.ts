'use server'

import { prisma } from '@/lib/prisma'
import { todayKST } from '@/lib/date'

type FatigueState = { push: number; pull: number; quad: number; post: number; cardio: number }
type FatigueZone = keyof FatigueState

// 활동별 부하표
const LOAD_TABLE: Record<string, FatigueState> = {
  BENCH:   { push: 3, pull: 2, quad: 0, post: 0, cardio: 0 },
  SQUAT:   { push: 0, pull: 0, quad: 3, post: 2, cardio: 1 },
  OHP:     { push: 2, pull: 2, quad: 0, post: 0, cardio: 0 },
  DEAD:    { push: 0, pull: 0, quad: 2, post: 3, cardio: 1 },
  EASY:    { push: 0, pull: 0, quad: 1, post: 1, cardio: 2 },
  QUALITY: { push: 0, pull: 0, quad: 1, post: 1, cardio: 3 },
  LONG:    { push: 0, pull: 0, quad: 2, post: 1, cardio: 3 },
  TENNIS:  { push: 2, pull: 1, quad: 1, post: 0, cardio: 2 },
  SOCCER:  { push: 0, pull: 0, quad: 2, post: 2, cardio: 3 },
  OTHER:   { push: 1, pull: 1, quad: 1, post: 1, cardio: 2 },
  REST:    { push: 0, pull: 0, quad: 0, post: 0, cardio: 0 },
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

  const activities = await prisma.activity.findMany({
    where: { date: { gte: fourteenDaysAgo } },
    include: { liftSession: true, runSession: true, sportSession: true },
    orderBy: { date: 'asc' },
  })

  const fatigue: FatigueState = { push: 0, pull: 0, quad: 0, post: 0, cardio: 0 }

  for (const act of activities) {
    const key = getActivityKey(act)
    const load = LOAD_TABLE[key] || LOAD_TABLE.REST
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
  const fatigue = await getFatigueState()

  // Last lift type
  const lastLift = await prisma.liftSession.findFirst({
    orderBy: { date: 'desc' },
    select: { liftType: true },
  })

  // Last run type
  const lastRun = await prisma.runSession.findFirst({
    orderBy: { date: 'desc' },
    select: { runType: true },
  })

  // Check consecutive activity days
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const recentActivities = await prisma.activity.findMany({
    where: { date: { gte: threeDaysAgo }, type: { not: 'REST' } },
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

  // Lift recommendation
  const upperFatigue = fatigue.push + fatigue.pull
  const lowerFatigue = fatigue.quad + fatigue.post
  let liftType: 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD'
  let liftReason: string

  if (upperFatigue <= lowerFatigue) {
    // Upper body more recovered
    if (lastLift?.liftType === 'BENCH') {
      liftType = 'OHP'
    } else if (lastLift?.liftType === 'OHP') {
      liftType = 'BENCH'
    } else {
      liftType = upperFatigue <= 2 ? 'BENCH' : 'OHP'
    }
    liftReason = '상체 회복 완료'
  } else {
    // Lower body more recovered
    if (lastLift?.liftType === 'SQUAT') {
      liftType = 'DEAD'
    } else if (lastLift?.liftType === 'DEAD') {
      liftType = 'SQUAT'
    } else {
      liftType = lowerFatigue <= 2 ? 'SQUAT' : 'DEAD'
    }
    liftReason = '하체 회복 완료'
  }

  // Get cycle info
  const config = await prisma.liftConfig.findUnique({ where: { liftType } })
  const weekLabel = config ? { FIVE: '5s', THREE: '3s', ONE: '1s' }[config.cycleWeek] : ''

  const primary = {
    type: 'LIFT' as const,
    subType: liftType,
    reason: `${liftReason} · ${liftType} ${weekLabel} week`,
  }

  // Alternatives
  const alternatives: { type: 'LIFT' | 'RUN' | 'SPORT' | 'REST'; subType?: string; reason: string }[] = []

  // 나머지 리프트 3종을 피로도 기준으로 정렬해서 추가
  const otherLifts = (['BENCH', 'SQUAT', 'OHP', 'DEAD'] as const).filter(t => t !== liftType)
  const liftScores = otherLifts.map(t => {
    const load = LOAD_TABLE[t]
    const score = (Object.keys(load) as FatigueZone[]).reduce((sum, z) => sum + load[z] * fatigue[z], 0)
    return { type: 'LIFT' as const, subType: t, score, reason: t }
  })
  liftScores.sort((a, b) => a.score - b.score) // 낮을수록 추천
  for (const ls of liftScores) {
    alternatives.push(ls)
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
