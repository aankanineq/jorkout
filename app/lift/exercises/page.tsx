export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import ExerciseList from './ExerciseList'

const SPLIT_ORDER = ['PUSH', 'PULL', 'LEG']

export default async function ExercisesPage() {
  const exercises = await prisma.exercise.findMany({
    orderBy: [{ splitType: 'asc' }, { order: 'asc' }],
  })

  const grouped = SPLIT_ORDER.map((splitType) => ({
    splitType,
    exercises: exercises.filter((e: any) => e.splitType === splitType),
  }))

  return <ExerciseList grouped={grouped} />
}
