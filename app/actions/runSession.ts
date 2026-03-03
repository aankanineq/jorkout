'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createRunSession(data: {
  distanceKm: number
  durationSec: number
  runType: string
  rpe?: number | null
  notes?: string
}) {
  const avgPace = Math.round(data.durationSec / data.distanceKm)

  await prisma.activity.create({
    data: {
      date: new Date(),
      type: 'RUN',
      notes: data.notes || null,
      runSession: {
        create: {
          date: new Date(),
          distanceKm: data.distanceKm,
          durationSec: data.durationSec,
          avgPace,
          rpe: data.rpe ?? null,
          runType: data.runType as any,
          notes: data.notes || null,
        },
      },
    },
  })

  redirect('/run')
}
