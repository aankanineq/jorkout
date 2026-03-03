'use server'

import { prisma } from '@/lib/prisma'
import { SplitType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const SPLIT_ORDER: SplitType[] = ['PUSH', 'PULL', 'LEG']

export async function getNextSplitType(): Promise<SplitType> {
  const lastSession = await prisma.liftSession.findFirst({
    orderBy: { date: 'desc' },
  })

  if (!lastSession) return 'PUSH'

  const idx = SPLIT_ORDER.indexOf(lastSession.splitType)
  return SPLIT_ORDER[(idx + 1) % SPLIT_ORDER.length]
}

export async function startSession(splitType: SplitType) {
  const exercises = await prisma.exercise.findMany({
    where: { splitType },
    orderBy: { order: 'asc' },
  })

  const activity = await prisma.activity.create({
    data: {
      date: new Date(),
      type: 'LIFT',
      liftSession: {
        create: {
          splitType,
          date: new Date(),
          exerciseLogs: {
            create: exercises.map((ex, i) => ({
              exerciseId: ex.id,
              order: i,
            })),
          },
        },
      },
    },
    include: { liftSession: true },
  })

  redirect(`/lift/session/${activity.liftSession!.id}`)
}

export async function saveSet(
  exerciseLogId: string,
  data: {
    setId?: string
    setNumber: number
    weight: number
    reps: number
  },
) {
  if (data.setId) {
    await prisma.exerciseSet.update({
      where: { id: data.setId },
      data: {
        weight: data.weight,
        reps: data.reps,
      },
    })
  } else {
    await prisma.exerciseSet.create({
      data: {
        exerciseLogId,
        setNumber: data.setNumber,
        weight: data.weight,
        reps: data.reps,
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

export async function deleteSession(sessionId: string) {
  const session = await prisma.liftSession.findUniqueOrThrow({
    where: { id: sessionId },
  })

  await prisma.liftSession.delete({ where: { id: sessionId } })
  await prisma.activity.delete({ where: { id: session.activityId } })

  revalidatePath('/lift')
}
