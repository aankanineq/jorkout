'use server'

import { prisma } from '@/lib/prisma'
import { LiftType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getExercisesByLiftType(liftType: LiftType) {
  return prisma.exercise.findMany({
    where: { liftType },
    orderBy: { order: 'asc' },
  })
}

export async function createExercise(data: {
  name: string
  liftType: LiftType
  role: string
  order: number
  targetSets: number
  targetMinReps: number
  targetMaxReps: number
  availableWeights?: number[]
}) {
  await prisma.exercise.create({
    data: {
      name: data.name,
      liftType: data.liftType,
      role: data.role,
      order: data.order,
      targetSets: data.targetSets,
      targetMinReps: data.targetMinReps,
      targetMaxReps: data.targetMaxReps,
      availableWeights: data.availableWeights ?? [],
    },
  })
  revalidatePath('/settings')
}

export async function updateExercise(
  id: string,
  data: {
    name?: string
    liftType?: LiftType
    role?: string
    order?: number
    targetSets?: number
    targetMinReps?: number
    targetMaxReps?: number
    equipmentType?: string
  },
) {
  await prisma.exercise.update({
    where: { id },
    data,
  })
  revalidatePath('/settings')
}

export async function deleteExercise(id: string) {
  await prisma.$transaction(async (tx) => {
    // ExerciseSet → ExerciseLog → Exercise 순서로 삭제
    await tx.exerciseSet.deleteMany({
      where: { exerciseLog: { exerciseId: id } },
    })
    await tx.exerciseLog.deleteMany({
      where: { exerciseId: id },
    })
    await tx.exercise.delete({ where: { id } })
  })
  revalidatePath('/settings')
}

export async function swapExerciseOrder(idA: string, idB: string) {
  const [a, b] = await Promise.all([
    prisma.exercise.findUniqueOrThrow({ where: { id: idA }, select: { order: true } }),
    prisma.exercise.findUniqueOrThrow({ where: { id: idB }, select: { order: true } }),
  ])
  await Promise.all([
    prisma.exercise.update({ where: { id: idA }, data: { order: b.order } }),
    prisma.exercise.update({ where: { id: idB }, data: { order: a.order } }),
  ])
  revalidatePath('/settings')
}

export async function updateWeightPresets(id: string, weights: number[]) {
  await prisma.exercise.update({
    where: { id },
    data: { availableWeights: weights.sort((a, b) => a - b) },
  })
  revalidatePath('/settings')
}
