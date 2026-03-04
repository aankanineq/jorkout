import { prisma } from '@/lib/prisma'
import { getAllLiftConfigs } from '@/app/actions/liftConfig'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const [configs, exercises] = await Promise.all([
    getAllLiftConfigs(),
    prisma.exercise.findMany({ orderBy: [{ liftType: 'asc' }, { order: 'asc' }] }),
  ])

  return (
    <SettingsClient
      configs={JSON.parse(JSON.stringify(configs))}
      exercises={JSON.parse(JSON.stringify(exercises))}
    />
  )
}
