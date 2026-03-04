import { prisma } from '@/lib/prisma'
import { deleteActivity } from '@/app/actions/activity'
import Link from 'next/link'

const ACTIVITY_ICONS: Record<string, string> = {
  LIFT: '🏋️', RUN: '🏃', SPORT: '🎾', REST: '😴',
}
const LIFT_NAMES: Record<string, string> = {
  BENCH: 'Bench Day', SQUAT: 'Squat Day', OHP: 'OHP Day', DEAD: 'Dead Day',
}
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default async function HistoryPage() {
  const activities = await prisma.activity.findMany({
    include: {
      liftSession: { include: { exerciseLogs: { include: { sets: true } } } },
      runSession: true,
      sportSession: true,
    },
    orderBy: { date: 'desc' },
    take: 50,
  })

  // Group by date
  const grouped: Record<string, typeof activities> = {}
  for (const act of activities) {
    const dateStr = new Date(act.date).toISOString().split('T')[0]
    if (!grouped[dateStr]) grouped[dateStr] = []
    grouped[dateStr].push(act)
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">활동 기록</h1>

      {Object.entries(grouped).map(([dateStr, acts]) => {
        const d = new Date(dateStr)
        const month = d.getMonth() + 1
        const day = d.getDate()
        const dayName = DAY_NAMES[d.getDay()]

        return (
          <div key={dateStr} className="space-y-2">
            <h2 className="text-sm text-white/40">{month}월 {day}일 ({dayName})</h2>
            {acts.map((act) => (
              <div key={act.id} className="bg-white/5 rounded-lg p-3 flex items-start gap-3">
                <span className="text-lg">{ACTIVITY_ICONS[act.type]}</span>
                <div className="flex-1 min-w-0">
                  {act.liftSession && (
                    <div>
                      <div className="font-medium">{LIFT_NAMES[act.liftSession.liftType]}</div>
                      {act.liftSession.duration && (
                        <div className="text-xs text-white/40">{act.liftSession.duration}분</div>
                      )}
                      <div className="text-xs text-white/30">
                        {act.liftSession.exerciseLogs.length}운동 ·{' '}
                        {act.liftSession.exerciseLogs.reduce((sum, l) => sum + l.sets.length, 0)}세트
                      </div>
                    </div>
                  )}
                  {act.runSession && (
                    <div>
                      <div className="font-medium">{act.runSession.runType} Run</div>
                      <div className="text-xs text-white/40">
                        {act.runSession.distanceKm}km ·{' '}
                        {Math.floor(act.runSession.avgPace / 60)}:{(act.runSession.avgPace % 60).toString().padStart(2, '0')}/km
                      </div>
                    </div>
                  )}
                  {act.sportSession && (
                    <div>
                      <div className="font-medium">{act.sportSession.sportType}</div>
                      <div className="text-xs text-white/40">
                        {act.sportSession.durationMin}분
                        {act.sportSession.rpe ? ` · RPE ${act.sportSession.rpe}` : ''}
                      </div>
                    </div>
                  )}
                  {act.type === 'REST' && (
                    <div className="font-medium">REST</div>
                  )}
                </div>
                <form action={async () => {
                  'use server'
                  await deleteActivity(act.id)
                }}>
                  <button className="text-red-400/40 text-xs">✕</button>
                </form>
              </div>
            ))}
          </div>
        )
      })}

      {activities.length === 0 && (
        <p className="text-white/30 text-center py-8">아직 기록이 없습니다</p>
      )}
    </div>
  )
}
