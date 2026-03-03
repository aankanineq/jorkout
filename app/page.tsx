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

const MODULE_LABEL: Record<string, string> = {
  SQ: '스쿼트',
  HN: '힙힌지',
  PU: '수평푸시',
  VU: '수직푸시',
  PL: '수직풀',
  RL: '수평풀',
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

export default async function Home() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get Monday of current week
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + mondayOffset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const [race, cycle, recentRuns, recentLifts, weekLifts, weekRuns] = await Promise.all([
    prisma.race.findFirst({
      where: { status: 'UPCOMING' },
      orderBy: { date: 'asc' },
    }),
    prisma.liftCycle.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        splits: {
          orderBy: { order: 'asc' },
          include: {
            modules: { orderBy: { order: 'asc' } },
            _count: { select: { sessions: true } },
          },
        },
      },
    }),
    prisma.runSession.findMany({
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.liftSession.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        splitDay: {
          include: { modules: { orderBy: { order: 'asc' } } },
        },
        exerciseLogs: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
        },
      },
    }),
    // Weekly lift sessions
    prisma.liftSession.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
    }),
    // Weekly run sessions
    prisma.runSession.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
    }),
  ])

  const dDay = race
    ? Math.ceil((new Date(race.date).getTime() - today.getTime()) / 86400000)
    : null

  // Weekly summary
  const weekLiftCount = weekLifts.length
  const weekRunKm = weekRuns.reduce((sum: number, r: any) => sum + r.distanceKm, 0)

  // Next split suggestion: find the split with fewest sessions, or round-robin
  const nextSplit = cycle?.splits.reduce((min: any, split: any) =>
    split._count.sessions < min._count.sessions ? split : min
    , cycle.splits[0])

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

        {/* Weekly summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-5 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">이번 주 리프팅</p>
            <p className="text-2xl font-bold text-indigo-600">{weekLiftCount}회</p>
          </div>
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-5 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">이번 주 러닝</p>
            <p className="text-2xl font-bold text-emerald-600">{weekRunKm.toFixed(1)} km</p>
          </div>
        </div>

        {/* Race card */}
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

        {/* Next workout suggestion */}
        {nextSplit && cycle && (
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">다음 운동</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">Split {nextSplit.dayLabel}</span>
                <div className="flex gap-1">
                  {nextSplit.modules.map((mod: any) => (
                    <span key={mod.id} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      {MODULE_LABEL[mod.moduleCode]}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/lift"
                className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                시작
              </Link>
            </div>
          </div>
        )}

        {/* Active Lift Cycle */}
        {cycle && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              리프팅 사이클 #{cycle.number} · {cycle.splitCount}분할
            </h2>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cycle.splitCount}, 1fr)` }}>
              {cycle.splits.map((split: any) => (
                <div key={split.id} className="rounded-xl bg-zinc-50 px-4 py-4 border border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-zinc-900">Split {split.dayLabel}</span>
                    <span className="text-xs text-zinc-400">{split._count.sessions}회</span>
                  </div>
                  <div className="space-y-1">
                    {split.modules.map((mod: any) => (
                      <span
                        key={mod.id}
                        className="inline-block mr-1.5 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium"
                      >
                        {MODULE_LABEL[mod.moduleCode]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Lift Sessions */}
        {recentLifts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">최근 리프팅</h2>
              <Link href="/lift/history" className="text-xs text-indigo-600 hover:text-indigo-500">프로그레션 →</Link>
            </div>
            {recentLifts.map((session: any) => (
              <div key={session.id} className="rounded-xl bg-zinc-50 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-700">{formatDate(session.date)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      Split {session.splitDay.dayLabel}
                    </span>
                  </div>
                  {session.duration && (
                    <span className="text-xs text-zinc-400">{session.duration}분</span>
                  )}
                </div>
                <div className="space-y-2">
                  {session.exerciseLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {log.exercise.isMain && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        )}
                        <span className="text-zinc-600">{log.exercise.name}</span>
                      </div>
                      <div className="flex gap-1 text-xs text-zinc-500">
                        {log.sets.filter((s: any) => !s.isWarmup).map((set: any) => (
                          <span key={set.id} className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                            {set.weight}×{set.reps}
                            {set.rpe && <span className="text-zinc-400"> @{set.rpe}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Runs */}
        {recentRuns.length > 0 && (
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
