import { prisma } from '@/lib/prisma'
import { deleteActivity } from '@/app/actions/activity'
import { autoCompleteStaleSessions } from '@/app/actions/liftSession'
import Link from 'next/link'
import { CalendarView } from './CalendarView'
import { toKST, nowKST } from '@/lib/date'

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

  // Parse month from URL or use current
  const now = nowKST()
  let year = now.getFullYear()
  let month = now.getMonth() // 0-indexed

  if (params.month) {
    const [y, m] = params.month.split('-').map(Number)
    if (y && m) {
      year = y
      month = m - 1
    }
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

  // Group by day number
  const byDay: Record<number, ActivityWithSessions[]> = {}
  for (const act of activities) {
    const day = toKST(act.date).getDate()
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(act)
  }

  // Prev/next month strings
  const prevDate = new Date(year, month - 1, 1)
  const nextDate = new Date(year, month + 1, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">기록</h1>
        <div className="flex items-center gap-4">
          <Link href={`/history?month=${prevMonth}`} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            &larr;
          </Link>
          <span className="font-semibold text-sm tabular-nums">
            {year}.{String(month + 1).padStart(2, '0')}
          </span>
          {!isCurrentMonth && (
            <Link href={`/history?month=${nextMonth}`} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              &rarr;
            </Link>
          )}
          {isCurrentMonth && <span className="w-4" />}
        </div>
      </div>

      <CalendarView
        year={year}
        month={month}
        byDay={byDay}
        today={now.getDate()}
        isCurrentMonth={isCurrentMonth}
        liftNames={LIFT_NAMES}
      />

      {/* Monthly summary */}
      <div className="bg-muted/50 rounded-xl px-4 py-3 text-xs text-muted-foreground font-medium flex justify-between">
        <span>LIFT {activities.filter(a => a.type === 'LIFT').length}회</span>
        <span>RUN {activities.filter(a => a.runSession).reduce((s, a) => s + a.runSession!.distanceKm, 0).toFixed(1)}km</span>
        <span>REST {activities.filter(a => a.type === 'REST').length}일</span>
      </div>
    </div>
  )
}
