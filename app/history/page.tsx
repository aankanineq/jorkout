import { prisma } from '@/lib/prisma'
import { autoCompleteStaleSessions } from '@/app/actions/liftSession'
import { getAllLiftConfigs } from '@/app/actions/liftConfig'
import { CalendarView } from './CalendarView'
import { ExerciseHistory } from './ExerciseHistory'
import { toKST, nowKST } from '@/lib/date'
import Link from 'next/link'

const LIFT_NAMES: Record<string, string> = {
  BENCH: 'Bench', SQUAT: 'Squat', OHP: 'OHP', DEAD: 'Dead',
}

type ActivityWithSessions = {
  id: string
  date: Date
  type: string
  liftSession?: { id: string, liftType: string, completed: boolean, duration: number | null, exerciseLogs: { sets: object[] }[] } | null
  runSession?: { id: string, runType: string, distanceKm: number, durationSec: number, avgPace: number } | null
  sportSession?: { id: string, sportType: string, durationMin: number | null, rpe: number | null } | null
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams

  await autoCompleteStaleSessions()

  const now = nowKST()
  let year = now.getFullYear()
  let month = now.getMonth()

  if (params.month) {
    const [y, m] = params.month.split('-').map(Number)
    if (y && m) { year = y; month = m - 1 }
  }

  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 1)

  const activities: ActivityWithSessions[] = await prisma.activity.findMany({
    where: { date: { gte: startOfMonth, lt: endOfMonth } },
    include: {
      liftSession: { include: { exerciseLogs: { include: { sets: true } } } },
      runSession: true,
      sportSession: true,
    },
    orderBy: { date: 'asc' },
  })

  const byDay: Record<number, ActivityWithSessions[]> = {}
  for (const act of activities) {
    const day = toKST(act.date).getDate()
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(act)
  }

  const prevDate = new Date(year, month - 1, 1)
  const nextDate = new Date(year, month + 1, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  // 운동별 최근 기록 (전체 기간)
  const liftQuery = (lt: string) => prisma.liftSession.findMany({
    where: { liftType: lt as 'BENCH', completed: true },
    orderBy: { date: 'desc' },
    take: 20,
    include: {
      activity: true,
      exerciseLogs: {
        include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  })

  const [benchSessions, squatSessions, ohpSessions, deadSessions, runSessions, liftConfigs] = await Promise.all([
    liftQuery('BENCH'),
    liftQuery('SQUAT'),
    liftQuery('OHP'),
    liftQuery('DEAD'),
    prisma.runSession.findMany({
      orderBy: { date: 'desc' },
      take: 20,
      include: { activity: true },
    }),
    getAllLiftConfigs(),
  ])

  const configMap = Object.fromEntries(liftConfigs.map(c => [c.liftType.toLowerCase(), c]))

  function serializeLift(sessions: typeof benchSessions) {
    return (sessions as typeof benchSessions).map(s => ({
      id: s.id,
      activityId: s.activityId,
      date: s.date.toISOString(),
      liftType: s.liftType,
      duration: s.duration,
      exerciseLogs: s.exerciseLogs.map(el => ({
        id: el.id,
        exerciseName: el.exercise.name,
        isMain: el.exercise.role === 'MAIN',
        sets: el.sets.map(set => ({ weight: set.weight, reps: set.reps })),
      })),
    }))
  }

  const runData = (runSessions as Array<{
    id: string; activityId: string; date: Date;
    runType: string; distanceKm: number; durationSec: number; avgPace: number
  }>).map(r => ({
    id: r.id,
    activityId: r.activityId,
    date: r.date.toISOString(),
    runType: r.runType,
    distanceKm: r.distanceKm,
    durationSec: r.durationSec,
    avgPace: r.avgPace,
  }))

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {/* 달력 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">기록</h1>
        <div className="flex items-center gap-4">
          <Link href={`/history?month=${prevMonth}`} className="text-muted-foreground hover:text-foreground transition-colors text-sm">&larr;</Link>
          <span className="font-semibold text-sm tabular-nums">{year}.{String(month + 1).padStart(2, '0')}</span>
          {!isCurrentMonth ? (
            <Link href={`/history?month=${nextMonth}`} className="text-muted-foreground hover:text-foreground transition-colors text-sm">&rarr;</Link>
          ) : <span className="w-4" />}
        </div>
      </div>

      {/* 달력 */}
      <CalendarView
        year={year}
        month={month}
        byDay={byDay}
        today={now.getDate()}
        isCurrentMonth={isCurrentMonth}
        liftNames={LIFT_NAMES}
      />

      <div className="bg-muted/50 rounded-xl px-4 py-3 text-xs text-muted-foreground font-medium flex justify-between">
        <span>LIFT {activities.filter(a => a.type === 'LIFT').length}회</span>
        <span>RUN {activities.filter(a => a.runSession).reduce((s, a) => s + a.runSession!.distanceKm, 0).toFixed(1)}km</span>
        <span>REST {activities.filter(a => a.type === 'REST').length}일</span>
      </div>

      {/* 운동별 기록 */}
      <ExerciseHistory
        bench={serializeLift(benchSessions as typeof benchSessions)}
        squat={serializeLift(squatSessions as typeof benchSessions)}
        ohp={serializeLift(ohpSessions as typeof benchSessions)}
        dead={serializeLift(deadSessions as typeof benchSessions)}
        run={runData}
        configs={configMap}
      />
    </div>
  )
}
