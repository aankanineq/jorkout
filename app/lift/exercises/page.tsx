import { prisma } from '@/lib/prisma'
import ExerciseList from './ExerciseList'

const MODULE_ORDER = ['SQ', 'HN', 'PU', 'VU', 'PL', 'RL']

export default async function ExercisesPage() {
  const exercises = await prisma.exercise.findMany({
    orderBy: [{ moduleCode: 'asc' }, { isMain: 'desc' }, { name: 'asc' }],
  })

  const grouped = MODULE_ORDER.map((code) => ({
    moduleCode: code,
    exercises: exercises.filter((e) => e.moduleCode === code),
  }))

  return <ExerciseList grouped={grouped} />
}
