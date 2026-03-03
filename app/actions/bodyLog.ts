'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createBodyLog(data: {
  weight?: number | null
  bodyFat?: number | null
  notes?: string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.bodyLog.upsert({
    where: { date: today },
    update: {
      weight: data.weight ?? null,
      bodyFat: data.bodyFat ?? null,
      notes: data.notes || null,
    },
    create: {
      date: today,
      weight: data.weight ?? null,
      bodyFat: data.bodyFat ?? null,
      notes: data.notes || null,
    },
  })

  revalidatePath('/body')
}
