import { prisma } from '@/lib/prisma'
import ProgressionView from './ProgressionView'

export default async function LiftHistoryPage() {
  const mainExercises = await prisma.exercise.findMany({
    where: { isMain: true },
    orderBy: { moduleCode: 'asc' },
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

  // Group by exercise
  const grouped = mainExercises.map((ex: any) => {
    const exLogs = logs
      .filter((l: any) => l.exerciseId === ex.id)
      .map((l: any) => {
        const workingSets = l.sets
        const topWeight = workingSets.length > 0 ? Math.max(...workingSets.map((s: any) => s.weight)) : 0
        const totalVolume = workingSets.reduce((sum: number, s: any) => sum + s.weight * s.reps, 0)
        const avgRpe = workingSets.filter((s: any) => s.rpe != null).length > 0
          ? workingSets.filter((s: any) => s.rpe != null).reduce((sum: number, s: any) => sum + s.rpe!, 0) / workingSets.filter((s: any) => s.rpe != null).length
          : null

        // Check if all working sets hit target reps (>=8) at RPE <=8 → suggest weight increase
        const allSetsHitTarget = workingSets.length >= 3 &&
          workingSets.every((s: any) => s.reps >= 8) &&
          (avgRpe === null || avgRpe <= 8)

        return {
          date: l.session.date.toISOString(),
          topWeight,
          totalVolume,
          avgRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
          sets: workingSets.map((s: any) => ({
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
          })),
          suggestIncrease: allSetsHitTarget,
        }
      })

    return {
      id: ex.id,
      name: ex.name,
      moduleCode: ex.moduleCode,
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
