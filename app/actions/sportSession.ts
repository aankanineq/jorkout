'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createSportSession(data: {
  sportType: string
  durationMin: number
  rpe?: number
  notes?: string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.activity.create({
    data: {
      date: today,
      type: 'SPORT',
      notes: data.notes || null,
      sportSession: {
        create: {
          date: today,
          sportType: data.sportType as 'TENNIS' | 'SOCCER' | 'OTHER',
          durationMin: data.durationMin,
          rpe: data.rpe ?? null,
          notes: data.notes || null,
        },
      },
    },
  })

  redirect('/')
}

export async function deleteSportSession(id: string) {
  const session = await prisma.sportSession.findUniqueOrThrow({
    where: { id },
  })
  await prisma.sportSession.delete({ where: { id } })
  await prisma.activity.delete({ where: { id: session.activityId } })
  redirect('/')
}
