export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SessionRecorder from './SessionRecorder'

const SPLIT_LABEL: Record<string, string> = {
  PUSH: '푸시',
  PULL: '풀',
  LEG: '레그',
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await prisma.liftSession.findUnique({
    where: { id },
    include: {
      exerciseLogs: {
        orderBy: { order: 'asc' },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  })

  if (!session) notFound()

  // Fetch previous session data for each exercise
  const exerciseIds = session.exerciseLogs.map((l: any) => l.exerciseId)
  const previousLogs = await prisma.exerciseLog.findMany({
    where: {
      exerciseId: { in: exerciseIds },
      sessionId: { not: session.id },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sets: {
        where: { isWarmup: false },
        orderBy: { setNumber: 'asc' },
      },
    },
    distinct: ['exerciseId'],
  })

  const previousData: Record<string, { weight: number; reps: number }[]> = {}
  previousLogs.forEach((log: any) => {
    previousData[log.exerciseId] = log.sets.map((s: any) => ({
      weight: s.weight,
      reps: s.reps,
    }))
  })

  // Check if progression is available for each exercise
  // All sets hit targetMaxReps → suggest +5kg
  const progressionInfo: Record<string, boolean> = {}
  for (const log of previousLogs) {
    const exercise = session.exerciseLogs.find((l: any) => l.exerciseId === log.exerciseId)?.exercise
    if (!exercise || log.sets.length === 0) continue
    const allHitMax = log.sets.every((s: any) => s.reps >= (exercise as any).targetMaxReps)
    progressionInfo[log.exerciseId] = allHitMax
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <SessionRecorder
          session={{
            id: session.id,
            date: session.date.toISOString(),
            splitType: session.splitType,
            splitLabel: SPLIT_LABEL[session.splitType],
            exerciseLogs: session.exerciseLogs.map((log: any) => ({
              id: log.id,
              exerciseId: log.exerciseId,
              exerciseName: log.exercise.name,
              role: log.exercise.role,
              targetSets: log.exercise.targetSets,
              targetMinReps: log.exercise.targetMinReps,
              targetMaxReps: log.exercise.targetMaxReps,
              order: log.order,
              sets: log.sets.map((s: any) => ({
                id: s.id,
                setNumber: s.setNumber,
                weight: s.weight,
                reps: s.reps,
                rpe: s.rpe,
                isWarmup: s.isWarmup,
              })),
            })),
          }}
          previousData={previousData}
          progressionInfo={progressionInfo}
        />
      </div>
    </div>
  )
}
