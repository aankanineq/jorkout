'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type RunPhase = 'BASE' | 'BUILD' | 'PEAK' | 'TAPER' | 'RACE_WEEK'

function generateWeeklyPlan(
  weeksUntilRace: number,
  raceDistanceKm: number,
): { weekNumber: number; targetKm: number; phase: RunPhase }[] {
  if (weeksUntilRace < 1) return []

  const weeks: { weekNumber: number; targetKm: number; phase: RunPhase }[] = []

  // Base weekly volume: roughly 2x race distance, capped
  const baseWeekly = Math.min(raceDistanceKm * 2, 60)

  for (let w = 1; w <= weeksUntilRace; w++) {
    const remaining = weeksUntilRace - w
    let phase: RunPhase
    let multiplier: number

    if (remaining === 0) {
      phase = 'RACE_WEEK'
      multiplier = 0.4
    } else if (remaining <= 1) {
      phase = 'TAPER'
      multiplier = 0.6
    } else if (remaining <= Math.floor(weeksUntilRace * 0.2)) {
      phase = 'PEAK'
      multiplier = 1.1
    } else if (w <= Math.floor(weeksUntilRace * 0.4)) {
      phase = 'BASE'
      // Gradual ramp from 60% to 85%
      const progress = w / Math.floor(weeksUntilRace * 0.4)
      multiplier = 0.6 + progress * 0.25
    } else {
      phase = 'BUILD'
      // 85% to 100%
      const buildStart = Math.floor(weeksUntilRace * 0.4)
      const buildEnd = weeksUntilRace - Math.floor(weeksUntilRace * 0.2) - 2
      const progress = buildEnd > buildStart ? (w - buildStart) / (buildEnd - buildStart) : 1
      multiplier = 0.85 + Math.min(progress, 1) * 0.15
    }

    weeks.push({
      weekNumber: w,
      targetKm: Math.round(baseWeekly * multiplier),
      phase,
    })
  }

  return weeks
}

export async function createRace(data: {
  name: string
  date: string
  distance: number
  goalTime?: number | null
}) {
  const raceDate = new Date(data.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksUntilRace = Math.floor((raceDate.getTime() - today.getTime()) / msPerWeek)

  const race = await prisma.race.create({
    data: {
      name: data.name,
      date: raceDate,
      distance: data.distance,
      goalTime: data.goalTime ?? null,
    },
  })

  // Auto-generate run plan if race is at least 4 weeks away
  if (weeksUntilRace >= 4) {
    const weeklyPlan = generateWeeklyPlan(weeksUntilRace, data.distance)

    await prisma.runPlan.create({
      data: {
        raceId: race.id,
        name: `${data.name} 플랜`,
        weeks: {
          create: weeklyPlan.map((w: any) => ({
            weekNumber: w.weekNumber,
            startDate: new Date(today.getTime() + (w.weekNumber - 1) * msPerWeek),
            targetKm: w.targetKm,
            phase: w.phase,
          })),
        },
      },
    })
  }

  redirect('/run')
}

export async function deleteRace(id: string) {
  await prisma.race.delete({ where: { id } })
  revalidatePath('/run')
}
