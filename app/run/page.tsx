export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(date))
}

function formatPace(paceSeconds: number): string {
  const mins = Math.floor(paceSeconds / 60)
  const secs = paceSeconds % 60
  return `${mins}'${secs.toString().padStart(2, '0')}"`
}

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const RUN_TYPE_LABEL: Record<string, string> = {
  EASY: '이지',
  LONG: '롱런',
  TEMPO: '템포',
  INTERVAL: '인터벌',
  RECOVERY: '리커버리',
  RACE: '레이스',
  FARTLEK: '파틀렉',
}

const RUN_TYPE_COLOR: Record<string, string> = {
  EASY: 'bg-sky-100 text-sky-700',
  LONG: 'bg-violet-100 text-violet-700',
  TEMPO: 'bg-orange-100 text-orange-700',
  INTERVAL: 'bg-rose-100 text-rose-700',
  RECOVERY: 'bg-teal-100 text-teal-700',
  RACE: 'bg-amber-100 text-amber-700',
  FARTLEK: 'bg-pink-100 text-pink-700',
}

const PHASE_LABEL: Record<string, string> = {
  BASE: '기초',
  BUILD: '강화',
  PEAK: '피크',
  TAPER: '테이퍼',
  RACE_WEEK: '대회주',
  RECOVERY: '회복',
}

const PHASE_COLOR: Record<string, string> = {
  BASE: 'bg-sky-100 text-sky-700',
  BUILD: 'bg-orange-100 text-orange-700',
  PEAK: 'bg-rose-100 text-rose-700',
  TAPER: 'bg-teal-100 text-teal-700',
  RACE_WEEK: 'bg-amber-100 text-amber-700',
  RECOVERY: 'bg-zinc-100 text-zinc-600',
}

export default async function RunPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get Monday of current week
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + mondayOffset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const [recentRuns, race, thisWeekRuns] = await Promise.all([
    prisma.runSession.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.race.findFirst({
      where: { status: 'UPCOMING' },
      orderBy: { date: 'asc' },
      include: {
        runPlan: {
          include: {
            weeks: { orderBy: { weekNumber: 'asc' } },
          },
        },
      },
    }),
    prisma.runSession.findMany({
      where: {
        date: { gte: weekStart, lt: weekEnd },
      },
    }),
  ])

  const dDay = race
    ? Math.ceil((new Date(race.date).getTime() - today.getTime()) / 86400000)
    : null

  const thisWeekKm = thisWeekRuns.reduce((sum: number, r: any) => sum + r.distanceKm, 0)

  // Find current week in plan
  const currentWeek = race?.runPlan?.weeks.find((w: any) => {
    const wStart = new Date(w.startDate)
    const wEnd = new Date(wStart)
    wEnd.setDate(wStart.getDate() + 7)
    return today >= wStart && today < wEnd
  })

  const weeksTotal = race?.runPlan?.weeks.length ?? 0
  const currentWeekNumber = currentWeek?.weekNumber ?? 0

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">러닝</h1>
          <div className="flex gap-2">
            <Link
              href="/run/race/new"
              className="text-sm px-4 py-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
            >
              대회 등록
            </Link>
            <Link
              href="/run/log"
              className="text-sm px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              러닝 기록
            </Link>
          </div>
        </div>

        {/* Race + D-Day */}
        {race && (
          <div className="rounded-xl bg-zinc-50 px-5 py-5 border border-zinc-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">목표 대회</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-zinc-900">{race.name}</p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {formatDate(race.date)} · {race.distance} km
                  {race.goalTime && ` · 목표 ${Math.floor(race.goalTime / 3600)}:${String(Math.floor((race.goalTime % 3600) / 60)).padStart(2, '0')}:${String(race.goalTime % 60).padStart(2, '0')}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600">
                  {dDay !== null && dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : '종료'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Weekly mileage dashboard */}
        {currentWeek && (
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  이번 주 ({currentWeekNumber}/{weeksTotal}주차)
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PHASE_COLOR[currentWeek.phase]}`}>
                  {PHASE_LABEL[currentWeek.phase]}
                </span>
              </div>
              <p className="text-sm text-zinc-500">
                {thisWeekKm.toFixed(1)} / {currentWeek.targetKm} km
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-zinc-200 rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((thisWeekKm / currentWeek.targetKm) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 text-right">
              {Math.round((thisWeekKm / currentWeek.targetKm) * 100)}% 달성
              {thisWeekKm < currentWeek.targetKm && ` · 남은 거리 ${(currentWeek.targetKm - thisWeekKm).toFixed(1)} km`}
            </p>
          </div>
        )}

        {/* Recent runs */}
        {recentRuns.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">최근 러닝</h2>
            {recentRuns.map((run: any) => (
              <div key={run.id} className="rounded-xl bg-zinc-50 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-700">{formatDate(run.date)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RUN_TYPE_COLOR[run.runType]}`}>
                        {RUN_TYPE_LABEL[run.runType]}
                      </span>
                      {run.rpe && (
                        <span className="text-xs text-zinc-400">RPE {run.rpe}</span>
                      )}
                    </div>
                    {run.notes && (
                      <p className="mt-1 text-xs text-zinc-400 truncate">{run.notes}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-6 text-right text-sm">
                    <div>
                      <p className="text-xs text-zinc-400 mb-0.5">거리</p>
                      <p className="text-zinc-700">{run.distanceKm.toFixed(1)} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 mb-0.5">페이스</p>
                      <p className="text-zinc-700">{formatPace(run.avgPace)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 mb-0.5">시간</p>
                      <p className="text-zinc-700">{formatDuration(run.durationSec)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-6 py-12 text-center space-y-3">
            <p className="text-zinc-500">러닝 기록이 없습니다</p>
            <Link
              href="/run/log"
              className="inline-block text-sm px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              첫 러닝 기록하기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
