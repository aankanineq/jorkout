'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { todayKST } from '@/lib/date'

export async function createBodyLog(data: {
  date?: string | null
  weight?: number | null
  bodyFat?: number | null
  muscleMass?: number | null
}) {
  const date = data.date ? new Date(data.date + 'T00:00:00Z') : todayKST()

  await prisma.bodyLog.upsert({
    where: { date },
    create: {
      date,
      weight: data.weight ?? null,
      bodyFat: data.bodyFat ?? null,
      muscleMass: data.muscleMass ?? null,
    },
    update: {
      weight: data.weight ?? null,
      bodyFat: data.bodyFat ?? null,
      muscleMass: data.muscleMass ?? null,
    },
  })

  revalidatePath('/')
  revalidatePath('/body')
}

export async function deleteBodyLog(id: string) {
  await prisma.bodyLog.delete({ where: { id } })
  revalidatePath('/')
  revalidatePath('/body')
}

export async function getRecentBodyLogs(days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.bodyLog.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'desc' },
  })
}
