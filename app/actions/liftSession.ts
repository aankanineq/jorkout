'use server'

import { prisma } from '@/lib/prisma'
import { LiftType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { advanceCycle, revertCycle } from './liftConfig'
import { todayKST, tomorrowKST } from '@/lib/date'

// 전날 이전의 미완료 리프트 세션을 자동 완료 처리
export async function autoCompleteStaleSessions() {
  const today = todayKST()

  const staleSessions = await prisma.liftSession.findMany({
    where: {
      completed: false,
      date: { lt: today },
    },
    select: { id: true, liftType: true },
  })

  if (staleSessions.length === 0) return

  await prisma.liftSession.updateMany({
    where: { id: { in: staleSessions.map((s) => s.id) } },
    data: { completed: true },
  })

  // 각 세션의 사이클 진행
  const advancedTypes = new Set<LiftType>()
  for (const s of staleSessions) {
    if (!advancedTypes.has(s.liftType)) {
      await advanceCycle(s.liftType)
      advancedTypes.add(s.liftType)
    }
  }
}

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
    isAmrap?: boolean
  },
) {
  if (data.setId) {
    await prisma.exerciseSet.update({
      where: { id: data.setId },
      data: { weight: data.weight, reps: data.reps, isWarmup: data.isWarmup ?? false, isAmrap: data.isAmrap ?? false },
    })
  } else {
    await prisma.exerciseSet.create({
      data: {
        exerciseLogId,
        setNumber: data.setNumber,
        weight: data.weight,
        reps: data.reps,
        isWarmup: data.isWarmup ?? false,
        isAmrap: data.isAmrap ?? false,
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
  const session = await prisma.liftSession.update({
    where: { id: sessionId },
    data: { completed: true },
    select: { liftType: true },
  })

  // 세션 완료 시 사이클 진행
  await advanceCycle(session.liftType)

  revalidatePath('/')
  redirect('/')
}

// 과거 날짜에 리프트 세션 삽입 (사이클 진행 없음)
export async function createPastLiftSession(liftType: LiftType, date: Date) {
  const exercises = await prisma.exercise.findMany({
    where: { liftType },
    orderBy: { order: 'asc' },
  })

  const activity = await prisma.activity.create({
    data: {
      date,
      type: 'LIFT',
      isBackfill: true,
      liftSession: {
        create: {
          liftType,
          date,
          completed: true,
          exerciseLogs: {
            create: exercises
              .filter((ex) => ex.role !== 'BBB')
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

  revalidatePath('/history')
  return activity.liftSession!.id
}

export async function deleteSession(sessionId: string) {
  const session = await prisma.liftSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { id: true, activityId: true, liftType: true, completed: true, activity: { select: { isBackfill: true } } },
  })

  await prisma.liftSession.delete({ where: { id: sessionId } })
  await prisma.activity.delete({ where: { id: session.activityId } })

  // 완료된 세션 삭제 시 사이클 되돌리기 (backfill 제외)
  if (session.completed && !session.activity.isBackfill) {
    await revertCycle(session.liftType)
  }

  revalidatePath('/')
}
