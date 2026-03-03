export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getNextSplitType } from '@/app/actions/liftSession'
import WeeklyTracker, { WeeklyDayData } from '@/app/components/WeeklyTracker'

const SPLIT_LABEL: Record<string, string> = {
  PUSH: '푸시',
  PULL: '풀',
  LEG: '레그',
}

export default async function Home() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get Sunday of current week
  const dayOfWeek = today.getDay() // 0 is Sunday
  const sundayOffset = -dayOfWeek
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + sundayOffset)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const [nextSplit, weekLifts, weekRuns] = await Promise.all([
    getNextSplitType(),
    prisma.liftSession.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
      select: {
        id: true,
        date: true,
        splitType: true,
        duration: true,
        exerciseLogs: {
          select: {
            id: true,
            exercise: { select: { name: true, role: true } },
            sets: { select: { id: true, weight: true, reps: true, isWarmup: true } }
          },
          orderBy: { order: 'asc' }
        }
      }
    }),
    prisma.runSession.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
      select: {
        id: true,
        date: true,
        distanceKm: true,
        durationSec: true,
        runType: true
      }
    }),
  ])

  const days: WeeklyDayData[] = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const isToday = d.getTime() === today.getTime()

    // Check if lift or run exists on this date
    const liftsToday = weekLifts.filter(l => {
      const ld = new Date(l.date)
      return ld.getFullYear() === d.getFullYear() && ld.getMonth() === d.getMonth() && ld.getDate() === d.getDate()
    })
    const runsToday = weekRuns.filter(r => {
      const rd = new Date(r.date)
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate()
    })

    return {
      date: d,
      dayName: ['일', '월', '화', '수', '목', '금', '토'][i],
      isToday,
      lifts: liftsToday.map(l => ({
        id: l.id,
        splitType: l.splitType,
        duration: l.duration,
        exerciseLogs: l.exerciseLogs
      })),
      runs: runsToday.map(r => ({
        id: r.id,
        runType: r.runType,
        distanceKm: r.distanceKm,
        durationSec: r.durationSec
      }))
    }
  })

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Jorkout</h1>
            <p className="mt-1 text-sm text-zinc-500">운동 계획 & 기록</p>
          </div>
          <nav className="flex gap-2">
            <Link href="/lift" className="text-sm px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">리프팅</Link>
            <Link href="/run" className="text-sm px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">러닝</Link>
          </nav>
        </div>

        {/* Weekly Activities */}
        <WeeklyTracker days={days} />

        {/* Today's workout suggestion */}
        <div className={`rounded-xl border px-5 py-4 ${days.find(d => d.isToday)?.lifts.length ? 'bg-zinc-50 border-zinc-200' : 'bg-indigo-50 border-indigo-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${days.find(d => d.isToday)?.lifts.length ? 'text-zinc-400' : 'text-indigo-400'}`}>
            오늘 운동
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-semibold ${days.find(d => d.isToday)?.lifts.length ? 'text-zinc-500' : 'text-zinc-900'}`}>
              {days.find(d => d.isToday)?.lifts.length ? '완료 🎉' : SPLIT_LABEL[nextSplit]}
            </span>
            {days.find(d => d.isToday)?.lifts.length ? (
              <span className="text-sm px-4 py-2 rounded-lg bg-zinc-100 text-zinc-400 font-medium cursor-default">
                수고하셨습니다
              </span>
            ) : (
              <form action={async () => {
                'use server';
                const { startSession } = await import('@/app/actions/liftSession');
                await startSession(nextSplit);
              }}>
                <button
                  type="submit"
                  className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  시작
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
