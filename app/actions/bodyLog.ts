'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { todayKST } from '@/lib/date'

export async function createBodyLog(data: {
  weight?: number | null
  bodyFat?: number | null
}) {
  const today = todayKST()

  await prisma.bodyLog.upsert({
    where: { date: today },
    create: {
      date: today,
      weight: data.weight ?? null,
      bodyFat: data.bodyFat ?? null,
    },
    update: {
      weight: data.weight ?? null,
      bodyFat: data.bodyFat ?? null,
    },
  })

  revalidatePath('/')
}

export async function getRecentBodyLogs(days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.bodyLog.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'desc' },
  })
}
