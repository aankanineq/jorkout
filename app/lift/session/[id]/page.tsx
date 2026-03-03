export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SessionRecorder from './SessionRecorder'

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await prisma.liftSession.findUnique({
    where: { id },
    include: {
      splitDay: {
        include: {
          modules: { orderBy: { order: 'asc' } },
        },
      },
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

  const moduleCodes = session.splitDay.modules.map((m: any) => m.moduleCode)

  const exercises = await prisma.exercise.findMany({
    where: { moduleCode: { in: moduleCodes } },
    orderBy: [{ moduleCode: 'asc' }, { isMain: 'desc' }, { name: 'asc' }],
  })

  // Check weekly running load
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + mondayOffset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const weekRuns = await prisma.runSession.findMany({
    where: { date: { gte: weekStart, lt: weekEnd } },
  })
  const weekRunKm = weekRuns.reduce((sum: number, r: any) => sum + r.distanceKm, 0)
  const hasHighIntensity = weekRuns.some((r: any) => ['TEMPO', 'INTERVAL', 'RACE'].includes(r.runType))

  let runLoadWarning: string | null = null
  if (weekRunKm >= 40) {
    runLoadWarning = `이번 주 러닝 ${weekRunKm.toFixed(1)}km — 메인 리프트 3세트 이하로 제한하세요`
  } else if (hasHighIntensity) {
    runLoadWarning = '이번 주 고강도 러닝이 있습니다 — 액세서리를 줄여보세요'
  }

  // Fetch previous session data for each exercise in the available pool
  const exerciseIds = exercises.map((e: any) => e.id)
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

  const previousData: Record<string, { weight: number; reps: number; rpe: number | null }[]> = {}
  previousLogs.forEach((log: any) => {
    previousData[log.exerciseId] = log.sets.map((s: any) => ({
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
    }))
  })

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <SessionRecorder
          session={{
            id: session.id,
            date: session.date.toISOString(),
            splitLabel: session.splitDay.dayLabel,
            modules: session.splitDay.modules.map((m: any) => m.moduleCode),
            exerciseLogs: session.exerciseLogs.map((log: any) => ({
              id: log.id,
              exerciseId: log.exerciseId,
              exerciseName: log.exercise.name,
              moduleCode: log.moduleCode,
              isMain: log.exercise.isMain,
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
          exercises={exercises.map((e: any) => ({
            id: e.id,
            name: e.name,
            moduleCode: e.moduleCode,
            isMain: e.isMain,
          }))}
          previousData={previousData}
          runLoadWarning={runLoadWarning}
        />
      </div>
    </div>
  )
}
