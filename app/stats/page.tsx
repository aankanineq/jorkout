import { prisma } from '@/lib/prisma'
import { getAllLiftConfigs } from '@/app/actions/liftConfig'
import { getRecentBodyLogs } from '@/app/actions/bodyLog'

export default async function StatsPage() {
  const [configs, bodyLogs, runSessions] = await Promise.all([
    getAllLiftConfigs(),
    getRecentBodyLogs(90),
    prisma.runSession.findMany({
      orderBy: { date: 'desc' },
      take: 100,
    }),
  ])

  // AMRAP 추적 (1s week 마지막 세트)
  const amrapLogs = await prisma.exerciseSet.findMany({
    where: {
      exerciseLog: {
        exercise: { role: 'MAIN' },
      },
      setNumber: 3, // 마지막 메인 세트
    },
    include: {
      exerciseLog: {
        include: {
          exercise: true,
          liftSession: true,
        },
      },
    },
    orderBy: { exerciseLog: { liftSession: { date: 'desc' } } },
    take: 50,
  })

  // 주간 러닝 km 집계
  const weeklyRun: Record<string, number> = {}
  for (const r of runSessions) {
    const d = new Date(r.date)
    const monday = new Date(d)
    const day = monday.getDay()
    monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1))
    const key = monday.toISOString().split('T')[0]
    weeklyRun[key] = (weeklyRun[key] || 0) + r.distanceKm
  }

  const weeklyRunEntries = Object.entries(weeklyRun).sort().slice(-8)

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">통계</h1>

      {/* 5/3/1 TM 진행도 */}
      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground font-medium font-medium">5/3/1 Training Max</h2>
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          {configs.map((c) => (
            <div key={c.liftType} className="flex items-center justify-between">
              <span className="text-sm">{c.liftType}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{c.tm}kg</span>
                <span className="text-xs text-muted-foreground/60">{c.weekLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AMRAP 추이 */}
      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground font-medium font-medium">AMRAP 기록</h2>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          {amrapLogs.length === 0 ? (
            <p className="text-muted-foreground/60 text-sm">아직 기록 없음</p>
          ) : (
            amrapLogs.slice(0, 10).map((set) => {
              const d = new Date(set.exerciseLog.liftSession.date)
              return (
                <div key={set.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground/80">{d.getMonth() + 1}/{d.getDate()}</span>
                  <span>{set.exerciseLog.exercise.name}</span>
                  <span className="font-mono">{set.weight}kg × {set.reps}</span>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* 주간 러닝 */}
      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground font-medium font-medium">주간 러닝</h2>
        <div className="bg-card border border-border rounded-xl p-4">
          {weeklyRunEntries.length === 0 ? (
            <p className="text-muted-foreground/60 text-sm">아직 기록 없음</p>
          ) : (
            <div className="flex items-end gap-1 h-24">
              {weeklyRunEntries.map(([week, km]) => {
                const maxKm = Math.max(...weeklyRunEntries.map(([, k]) => k))
                const height = maxKm > 0 ? (km / maxKm) * 100 : 0
                return (
                  <div key={week} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground/80">{km.toFixed(0)}</span>
                    <div
                      className="w-full bg-blue-500/60 rounded-t"
                      style={{ height: `${height}%`, minHeight: km > 0 ? '4px' : '0' }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* 체중 추이 */}
      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground font-medium font-medium">체중 추이</h2>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          {bodyLogs.length === 0 ? (
            <p className="text-muted-foreground/60 text-sm">아직 기록 없음</p>
          ) : (
            bodyLogs.slice(0, 10).map((log) => {
              const d = new Date(log.date)
              return (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground/80">{d.getMonth() + 1}/{d.getDate()}</span>
                  <span className="font-mono">
                    {log.weight ?? '-'}kg
                    {log.bodyFat ? ` · ${log.bodyFat}%` : ''}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
