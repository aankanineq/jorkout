export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import RecentSessions from './RecentSessions'

const SPLIT_LABEL: Record<string, string> = {
  PUSH: '푸시',
  PULL: '풀',
  LEG: '레그',
}

export default async function LiftPage() {

  const recentSessions = await prisma.liftSession.findMany({
    orderBy: { date: 'desc' },
    take: 10,
    include: {
      exerciseLogs: {
        orderBy: { order: 'asc' },
        include: {
          exercise: true,
          sets: {
            where: { isWarmup: false },
            orderBy: { setNumber: 'asc' },
          },
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-400 hover:text-zinc-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900">리프팅</h1>
          </div>
          <Link
            href="/lift/exercises"
            className="text-sm px-4 py-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
          >
            운동 관리
          </Link>
        </div>

        {/* Recent sessions */}
        <RecentSessions
          sessions={recentSessions.map((s: any) => ({
            id: s.id,
            date: s.date.toISOString(),
            splitType: s.splitType,
            duration: s.duration,
            exerciseLogs: s.exerciseLogs.map((log: any) => ({
              id: log.id,
              exercise: { name: log.exercise.name, role: log.exercise.role },
              sets: log.sets.map((set: any) => ({ id: set.id, weight: set.weight, reps: set.reps })),
            })),
          }))}
        />
      </div>
    </div>
  )
}
