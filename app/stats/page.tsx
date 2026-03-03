import { prisma } from '@/lib/prisma'
import StatsView from './StatsView'

export default async function StatsPage() {
  const [mainExerciseLogs, runSessions, bodyLogs] = await Promise.all([
    prisma.exerciseLog.findMany({
      where: { exercise: { isMain: true } },
      orderBy: { createdAt: 'asc' },
      include: {
        exercise: true,
        session: true,
        sets: {
          where: { isWarmup: false },
          orderBy: { setNumber: 'asc' },
        },
      },
    }),
    prisma.runSession.findMany({
      orderBy: { date: 'asc' },
    }),
    prisma.bodyLog.findMany({
      orderBy: { date: 'asc' },
    }),
  ])

  // Aggregate lift data by exercise → by week
  const liftData: Record<string, { name: string; points: { date: string; weight: number }[] }> = {}
  mainExerciseLogs.forEach((log) => {
    const topWeight = log.sets.length > 0 ? Math.max(...log.sets.map((s) => s.weight)) : 0
    if (topWeight === 0) return
    if (!liftData[log.exerciseId]) {
      liftData[log.exerciseId] = { name: log.exercise.name, points: [] }
    }
    liftData[log.exerciseId].points.push({
      date: log.session.date.toISOString(),
      weight: topWeight,
    })
  })

  // Aggregate run data by week
  const runWeekly: { weekStart: string; totalKm: number; count: number }[] = []
  const weekMap = new Map<string, { totalKm: number; count: number }>()
  runSessions.forEach((r) => {
    const d = new Date(r.date)
    const day = d.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const monday = new Date(d)
    monday.setDate(d.getDate() + mondayOffset)
    const key = monday.toISOString().slice(0, 10)
    const existing = weekMap.get(key) || { totalKm: 0, count: 0 }
    existing.totalKm += r.distanceKm
    existing.count += 1
    weekMap.set(key, existing)
  })
  weekMap.forEach((v, k) => runWeekly.push({ weekStart: k, ...v }))
  runWeekly.sort((a, b) => a.weekStart.localeCompare(b.weekStart))

  const bodyData = bodyLogs.map((b) => ({
    date: b.date.toISOString(),
    weight: b.weight,
    bodyFat: b.bodyFat,
  }))

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <StatsView
          liftData={Object.values(liftData)}
          runWeekly={runWeekly}
          bodyData={bodyData}
        />
      </div>
    </div>
  )
}
