'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function getNextRunType(): Promise<'EASY' | 'QUALITY' | 'LONG'> {
  const last = await prisma.runSession.findFirst({
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
}) {
  const avgPace = Math.round(data.durationSec / data.distanceKm)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.activity.create({
    data: {
      date: today,
      type: 'RUN',
      notes: data.notes || null,
      runSession: {
        create: {
          date: today,
          runType: data.runType as 'EASY' | 'QUALITY' | 'LONG',
          distanceKm: data.distanceKm,
          durationSec: data.durationSec,
          avgPace,
          raceId: data.raceId || null,
        },
      },
    },
  })

  redirect('/')
}
