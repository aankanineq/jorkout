import { prisma } from '@/lib/prisma'
import { createRace, deleteRace } from '@/app/actions/race'
import { RaceForm } from './RaceForm'

export default async function RacePage() {
  const races = await prisma.race.findMany({
    orderBy: { date: 'asc' },
  })

  const now = new Date()
  const upcoming = races.filter((r) => r.status === 'UPCOMING')
  const past = races.filter((r) => r.status !== 'UPCOMING')

  // 이번 주 러닝 km
  const monday = new Date(now)
  const day = monday.getDay()
  monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 7)

  const weekRuns = await prisma.runSession.findMany({
    where: { date: { gte: monday, lt: sunday } },
  })
  const weekKm = weekRuns.reduce((sum, r) => sum + r.distanceKm, 0)

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">대회</h1>

      {/* 다가오는 대회 */}
      {upcoming.map((race) => {
        const dDay = Math.ceil((new Date(race.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const progress = race.weeklyTargetKm ? Math.min(100, (weekKm / race.weeklyTargetKm) * 100) : 0

        return (
          <div key={race.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{race.name}</div>
                <div className="text-sm text-muted-foreground/80">
                  {new Date(race.date).toLocaleDateString('ko-KR')} · {race.distanceKm}km
                </div>
                {race.goalTime && (
                  <div className="text-sm text-muted-foreground/80">목표: {race.goalTime}</div>
                )}
              </div>
              <div className="text-2xl font-bold text-muted-foreground font-medium">D-{dDay}</div>
            </div>

            {race.weeklyTargetKm && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground/80">
                  이번 주 러닝: {weekKm.toFixed(1)}/{race.weeklyTargetKm}km
                </div>
                <div className="h-2 bg-muted border border-border/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <form action={async () => {
              'use server'
              await deleteRace(race.id)
            }}>
              <button className="text-xs text-red-400/60">삭제</button>
            </form>
          </div>
        )
      })}

      {/* 대회 등록 */}
      <RaceForm />

      {/* 지난 대회 */}
      {past.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm text-muted-foreground font-medium font-medium">지난 대회</h2>
          {past.map((race) => (
            <div key={race.id} className="bg-card border border-border rounded-lg p-3">
              <div className="font-medium">{race.name}</div>
              <div className="text-xs text-muted-foreground/80">
                {new Date(race.date).toLocaleDateString('ko-KR')} · {race.distanceKm}km
                {race.actualTime ? ` · ${race.actualTime}` : ''}
                {' · '}{race.status}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
