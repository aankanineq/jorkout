'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createExercise(data: {
  name: string
  splitType: string
  role: string
  targetSets: number
  targetMinReps: number
  targetMaxReps: number
  order: number
  notes?: string
}) {
  await prisma.exercise.create({
    data: {
      name: data.name,
      splitType: data.splitType as any,
      role: data.role as any,
      targetSets: data.targetSets,
      targetMinReps: data.targetMinReps,
      targetMaxReps: data.targetMaxReps,
      order: data.order,
      notes: data.notes || null,
    },
  })

  revalidatePath('/lift/exercises')
}

export async function updateExercise(
  id: string,
  data: {
    name: string
    splitType: string
    role: string
    targetSets: number
    targetMinReps: number
    targetMaxReps: number
    order: number
    notes?: string
  },
) {
  await prisma.exercise.update({
    where: { id },
    data: {
      name: data.name,
      splitType: data.splitType as any,
      role: data.role as any,
      targetSets: data.targetSets,
      targetMinReps: data.targetMinReps,
      targetMaxReps: data.targetMaxReps,
      order: data.order,
      notes: data.notes || null,
    },
  })

  revalidatePath('/lift/exercises')
}

export async function deleteExercise(id: string) {
  await prisma.exercise.delete({ where: { id } })
  revalidatePath('/lift/exercises')
}
