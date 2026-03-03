export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import ProgressionView from './ProgressionView'

export default async function LiftHistoryPage() {
  const mainExercises = await prisma.exercise.findMany({
    where: { role: 'MAIN' },
    orderBy: [{ splitType: 'asc' }, { order: 'asc' }],
  })

  const logs = await prisma.exerciseLog.findMany({
    where: {
      exerciseId: { in: mainExercises.map((e: any) => e.id) },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      exercise: true,
      session: true,
      sets: {
        where: { isWarmup: false },
        orderBy: { setNumber: 'asc' },
      },
    },
  })

  const grouped = mainExercises.map((ex: any) => {
    const exLogs = logs
      .filter((l: any) => l.exerciseId === ex.id)
      .map((l: any) => {
        const workingSets = l.sets
        const topWeight = workingSets.length > 0 ? Math.max(...workingSets.map((s: any) => s.weight)) : 0
        const totalVolume = workingSets.reduce((sum: number, s: any) => sum + s.weight * s.reps, 0)

        const allSetsHitMax = workingSets.length >= ex.targetSets &&
          workingSets.every((s: any) => s.reps >= ex.targetMaxReps)

        return {
          date: l.session.date.toISOString(),
          topWeight,
          totalVolume,
          sets: workingSets.map((s: any) => ({
            weight: s.weight,
            reps: s.reps,
          })),
          suggestIncrease: allSetsHitMax,
        }
      })

    return {
      id: ex.id,
      name: ex.name,
      splitType: ex.splitType,
      logs: exLogs,
    }
  })

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <ProgressionView exercises={grouped} />
      </div>
    </div>
  )
}
