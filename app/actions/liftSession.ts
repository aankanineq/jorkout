'use server'

import { prisma } from '@/lib/prisma'
import { LiftType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { advanceCycle } from './liftConfig'
import { todayKST, tomorrowKST } from '@/lib/date'

export async function startSession(liftType: LiftType) {
  const today = todayKST()
  const tomorrow = tomorrowKST()

  // 오늘 같은 liftType 세션 있으면 기존 반환
  const existing = await prisma.liftSession.findFirst({
    where: { date: { gte: today, lt: tomorrow }, liftType },
  })

  if (existing) {
    redirect(`/session/${existing.id}`)
  }

  // 운동 목록
  const exercises = await prisma.exercise.findMany({
    where: { liftType },
    orderBy: { order: 'asc' },
  })

  // Activity + LiftSession + ExerciseLogs 생성
  const activity = await prisma.activity.create({
    data: {
      date: today,
      type: 'LIFT',
      liftSession: {
        create: {
          liftType,
          date: today,
          exerciseLogs: {
            create: exercises
              .filter((ex) => ex.role !== 'BBB') // BBB는 MAIN과 같은 운동이므로 별도 log 불필요
              .map((ex, i) => ({
                exerciseId: ex.id,
                order: i,
              })),
          },
        },
      },
    },
    include: { liftSession: true },
  })

  // 사이클 진행
  await advanceCycle(liftType)

  redirect(`/session/${activity.liftSession!.id}`)
}

export async function saveSet(
  exerciseLogId: string,
  data: {
    setId?: string
    setNumber: number
    weight: number
    reps: number
    isWarmup?: boolean
  },
) {
  if (data.setId) {
    await prisma.exerciseSet.update({
      where: { id: data.setId },
      data: { weight: data.weight, reps: data.reps, isWarmup: data.isWarmup ?? false },
    })
  } else {
    await prisma.exerciseSet.create({
      data: {
        exerciseLogId,
        setNumber: data.setNumber,
        weight: data.weight,
        reps: data.reps,
        isWarmup: data.isWarmup ?? false,
      },
    })
  }

  const log = await prisma.exerciseLog.findUniqueOrThrow({
    where: { id: exerciseLogId },
  })
  revalidatePath(`/session/${log.liftSessionId}`)
}

export async function deleteSet(setId: string) {
  const set = await prisma.exerciseSet.findUniqueOrThrow({
    where: { id: setId },
    include: { exerciseLog: true },
  })
  await prisma.exerciseSet.delete({ where: { id: setId } })
  revalidatePath(`/session/${set.exerciseLog.liftSessionId}`)
}

export async function completeSession(sessionId: string) {
  await prisma.liftSession.update({
    where: { id: sessionId },
    data: { completed: true },
  })
  revalidatePath('/')
  redirect('/')
}

export async function deleteSession(sessionId: string) {
  const session = await prisma.liftSession.findUniqueOrThrow({
    where: { id: sessionId },
  })
  await prisma.liftSession.delete({ where: { id: sessionId } })
  await prisma.activity.delete({ where: { id: session.activityId } })
  revalidatePath('/')
}
