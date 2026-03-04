'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { todayKST, tomorrowKST, getMondayKST } from '@/lib/date'

export async function getRecentActivities(days: number = 14) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.activity.findMany({
    where: { date: { gte: since } },
    include: {
      liftSession: true,
      runSession: true,
      sportSession: true,
    },
    orderBy: { date: 'desc' },
  })
}

export async function getWeeklyStats(weekStart?: Date) {
  const start = weekStart ?? getMondayKST()
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  const activities = await prisma.activity.findMany({
    where: { date: { gte: start, lt: end } },
    include: { liftSession: true, runSession: true, sportSession: true },
    orderBy: { date: 'asc' },
  })

  const runSessions = activities
    .filter((a) => a.runSession)
    .map((a) => a.runSession!)

  return {
    activities,
    liftCount: activities.filter((a) => a.type === 'LIFT').length,
    runKm: runSessions.reduce((sum, r) => sum + r.distanceKm, 0),
    sportCount: activities.filter((a) => a.type === 'SPORT').length,
    restCount: activities.filter((a) => a.type === 'REST').length,
  }
}

export async function logRest() {
  const today = todayKST()
  const tomorrow = tomorrowKST()

  // 중복 방지
  const existing = await prisma.activity.findFirst({
    where: { date: { gte: today, lt: tomorrow }, type: 'REST' },
  })

  if (!existing) {
    await prisma.activity.create({
      data: { date: today, type: 'REST' },
    })
  }

  revalidatePath('/')
}

export async function getTodayActivities() {
  const today = todayKST()
  const tomorrow = tomorrowKST()

  return prisma.activity.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    include: { liftSession: true, runSession: true, sportSession: true },
    orderBy: { date: 'desc' },
  })
}

export async function deleteActivity(id: string) {
  await prisma.activity.delete({ where: { id } })
  revalidatePath('/')
  revalidatePath('/history')
}

