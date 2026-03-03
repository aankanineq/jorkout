'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startSession(splitDayId: string) {
  const splitDay = await prisma.splitDay.findUniqueOrThrow({
    where: { id: splitDayId },
    include: { cycle: true },
  })

  const activity = await prisma.activity.create({
    data: {
      date: new Date(),
      type: 'LIFT',
      liftSession: {
        create: {
          cycleId: splitDay.cycleId,
          splitDayId,
          date: new Date(),
        },
      },
    },
    include: { liftSession: true },
  })

  redirect(`/lift/session/${activity.liftSession!.id}`)
}

export async function addExerciseLog(
  sessionId: string,
  exerciseId: string,
  moduleCode: string,
) {
  const maxOrder = await prisma.exerciseLog.aggregate({
    where: { sessionId },
    _max: { order: true },
  })

  await prisma.exerciseLog.create({
    data: {
      sessionId,
      exerciseId,
      moduleCode: moduleCode as any,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })

  revalidatePath(`/lift/session/${sessionId}`)
}

export async function saveSet(
  exerciseLogId: string,
  data: {
    setId?: string
    setNumber: number
    weight: number
    reps: number
    rpe?: number | null
    isWarmup?: boolean
  },
) {
  if (data.setId) {
    await prisma.exerciseSet.update({
      where: { id: data.setId },
      data: {
        weight: data.weight,
        reps: data.reps,
        rpe: data.rpe,
        isWarmup: data.isWarmup ?? false,
      },
    })
  } else {
    await prisma.exerciseSet.create({
      data: {
        exerciseLogId,
        setNumber: data.setNumber,
        weight: data.weight,
        reps: data.reps,
        rpe: data.rpe,
        isWarmup: data.isWarmup ?? false,
      },
    })
  }

  const log = await prisma.exerciseLog.findUniqueOrThrow({
    where: { id: exerciseLogId },
  })
  revalidatePath(`/lift/session/${log.sessionId}`)
}

export async function deleteSet(setId: string) {
  const set = await prisma.exerciseSet.findUniqueOrThrow({
    where: { id: setId },
    include: { exerciseLog: true },
  })

  await prisma.exerciseSet.delete({ where: { id: setId } })
  revalidatePath(`/lift/session/${set.exerciseLog.sessionId}`)
}

export async function deleteExerciseLog(exerciseLogId: string) {
  const log = await prisma.exerciseLog.findUniqueOrThrow({
    where: { id: exerciseLogId },
  })

  await prisma.exerciseLog.delete({ where: { id: exerciseLogId } })
  revalidatePath(`/lift/session/${log.sessionId}`)
}
