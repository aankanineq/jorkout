import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getLiftConfig } from '@/app/actions/liftConfig'
import { completeSession } from '@/app/actions/liftSession'
import { SessionRecorder } from './SessionRecorder'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await prisma.liftSession.findUnique({
    where: { id },
    include: {
      exerciseLogs: {
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!session) return notFound()

  const config = await getLiftConfig(session.liftType)

  // 이전 기록 조회 (각 운동별 마지막 세션)
  const previousLogs = await Promise.all(
    session.exerciseLogs.map(async (log) => {
      const prev = await prisma.exerciseLog.findFirst({
        where: {
          exerciseId: log.exerciseId,
          liftSessionId: { not: session.id },
        },
        include: { sets: { orderBy: { setNumber: 'asc' } } },
        orderBy: { liftSession: { date: 'desc' } },
      })
      return { exerciseId: log.exerciseId, previousSets: prev?.sets ?? [] }
    })
  )

  const prevMap = Object.fromEntries(
    previousLogs.map((p) => [p.exerciseId, p.previousSets])
  )

  async function handleComplete() {
    'use server'
    await completeSession(session!.id)
  }

  return (
    <SessionRecorder
      session={JSON.parse(JSON.stringify(session))}
      config={JSON.parse(JSON.stringify(config))}
      previousSets={JSON.parse(JSON.stringify(prevMap))}
      onComplete={handleComplete}
    />
  )
}
