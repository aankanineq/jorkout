'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createRace(data: {
  name: string
  date: string
  distanceKm: number
  goalTime?: string
  weeklyTargetKm?: number
}) {
  await prisma.race.create({
    data: {
      name: data.name,
      date: new Date(data.date),
      distanceKm: data.distanceKm,
      goalTime: data.goalTime || null,
      weeklyTargetKm: data.weeklyTargetKm ?? null,
    },
  })
  revalidatePath('/race')
}

export async function updateRace(
  id: string,
  data: {
    actualTime?: string
    status?: string
    weeklyTargetKm?: number
  },
) {
  await prisma.race.update({
    where: { id },
    data,
  })
  revalidatePath('/race')
}

export async function deleteRace(id: string) {
  await prisma.race.delete({ where: { id } })
  revalidatePath('/race')
}
