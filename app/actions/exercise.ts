'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createExercise(data: {
  name: string
  moduleCode: string
  isMain: boolean
  notes?: string
}) {
  await prisma.exercise.create({
    data: {
      name: data.name,
      moduleCode: data.moduleCode as any,
      isMain: data.isMain,
      notes: data.notes || null,
    },
  })

  revalidatePath('/lift/exercises')
}

export async function updateExercise(
  id: string,
  data: {
    name: string
    moduleCode: string
    isMain: boolean
    notes?: string
  },
) {
  await prisma.exercise.update({
    where: { id },
    data: {
      name: data.name,
      moduleCode: data.moduleCode as any,
      isMain: data.isMain,
      notes: data.notes || null,
    },
  })

  revalidatePath('/lift/exercises')
}

export async function deleteExercise(id: string) {
  await prisma.exercise.delete({ where: { id } })
  revalidatePath('/lift/exercises')
}
