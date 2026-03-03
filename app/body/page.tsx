export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import BodyTracker from './BodyTracker'

export default async function BodyPage() {
  const logs = await prisma.bodyLog.findMany({
    orderBy: { date: 'desc' },
    take: 30,
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayLog = logs.find((l: any) => new Date(l.date).toISOString().slice(0, 10) === today.toISOString().slice(0, 10))

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <BodyTracker
          todayLog={todayLog ? {
            weight: todayLog.weight,
            bodyFat: todayLog.bodyFat,
            notes: todayLog.notes,
          } : null}
          recentLogs={logs.map((l: any) => ({
            date: l.date.toISOString(),
            weight: l.weight,
            bodyFat: l.bodyFat,
          }))}
        />
      </div>
    </div>
  )
}
