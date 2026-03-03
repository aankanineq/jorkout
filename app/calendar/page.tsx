import { prisma } from '@/lib/prisma'
import CalendarView from './CalendarView'

export default async function CalendarPage() {
  const activities = await prisma.activity.findMany({
    orderBy: { date: 'asc' },
    include: {
      liftSession: {
        include: {
          splitDay: {
            include: { modules: { orderBy: { order: 'asc' } } },
          },
        },
      },
      runSession: true,
    },
  })

  const data = activities.map((a: any) => ({
    id: a.id,
    date: a.date.toISOString(),
    type: a.type as 'LIFT' | 'RUN',
    lift: a.liftSession
      ? {
        splitLabel: a.liftSession.splitDay.dayLabel,
        modules: a.liftSession.splitDay.modules.map((m: any) => m.moduleCode) || [],
      }
      : null,
    run: a.runSession
      ? {
        distanceKm: a.runSession.distanceKm,
        avgPace: a.runSession.avgPace,
        runType: a.runSession.runType,
      }
      : null,
  }))

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <CalendarView activities={data} />
      </div>
    </div>
  )
}
