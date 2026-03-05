'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { todayKST } from '@/lib/date'

export async function getNextRunType(): Promise<'EASY' | 'QUALITY' | 'LONG'> {
  const last = await prisma.runSession.findFirst({
    where: { activity: { isBackfill: false } },
    orderBy: { date: 'desc' },
    select: { runType: true },
  })

  if (!last) return 'EASY'
  if (last.runType === 'EASY') return 'QUALITY'
  if (last.runType === 'QUALITY') return 'LONG'
  return 'EASY'
}

export async function createRunSession(data: {
  distanceKm: number
  durationSec: number
  runType: string
  notes?: string
  raceId?: string
  date?: Date
}) {
  const avgPace = Math.round(data.durationSec / data.distanceKm)
  const date = data.date ?? todayKST()

  await prisma.activity.create({
    data: {
      date,
      type: 'RUN',
      notes: data.notes || null,
      isBackfill: !!data.date,
      runSession: {
        create: {
          date,
          runType: data.runType as 'EASY' | 'QUALITY' | 'LONG',
          distanceKm: data.distanceKm,
          durationSec: data.durationSec,
          avgPace,
          raceId: data.raceId || null,
        },
      },
    },
  })

  if (data.date) {
    revalidatePath('/history')
  } else {
    redirect('/')
  }
}

export async function updateRunSession(
  id: string,
  data: {
    distanceKm: number
    durationSec: number
    runType: string
  },
) {
  const avgPace = Math.round(data.durationSec / data.distanceKm)

  await prisma.runSession.update({
    where: { id },
    data: {
      runType: data.runType as 'EASY' | 'QUALITY' | 'LONG',
      distanceKm: data.distanceKm,
      durationSec: data.durationSec,
      avgPace,
    },
  })

  revalidatePath('/history')
}
