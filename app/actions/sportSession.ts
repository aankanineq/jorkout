'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { todayKST } from '@/lib/date'

export async function createSportSession(data: {
  sportType: string
  durationMin: number
  rpe?: number
  notes?: string
  date?: Date
}) {
  const date = data.date ?? todayKST()

  await prisma.activity.create({
    data: {
      date,
      type: 'SPORT',
      notes: data.notes || null,
      isBackfill: !!data.date,
      sportSession: {
        create: {
          date,
          sportType: data.sportType as 'TENNIS' | 'SOCCER' | 'OTHER',
          durationMin: data.durationMin,
          rpe: data.rpe ?? null,
          notes: data.notes || null,
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

export async function updateSportSession(
  id: string,
  data: {
    sportType: string
    durationMin: number
    rpe?: number | null
  },
) {
  await prisma.sportSession.update({
    where: { id },
    data: {
      sportType: data.sportType as 'TENNIS' | 'SOCCER' | 'OTHER',
      durationMin: data.durationMin,
      rpe: data.rpe ?? null,
    },
  })

  revalidatePath('/history')
}

export async function deleteSportSession(id: string) {
  const session = await prisma.sportSession.findUniqueOrThrow({
    where: { id },
  })
  await prisma.sportSession.delete({ where: { id } })
  await prisma.activity.delete({ where: { id: session.activityId } })
  redirect('/')
}
