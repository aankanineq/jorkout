import { prisma } from '@/lib/prisma'
import { getAllLiftConfigs } from '@/app/actions/liftConfig'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const [configs, exercises, equipmentConfigs] = await Promise.all([
    getAllLiftConfigs(),
    prisma.exercise.findMany({ orderBy: [{ liftType: 'asc' }, { order: 'asc' }] }),
    prisma.equipmentConfig.findMany(),
  ])

  return (
    <SettingsClient
      configs={JSON.parse(JSON.stringify(configs))}
      exercises={JSON.parse(JSON.stringify(exercises))}
      equipmentConfigs={JSON.parse(JSON.stringify(equipmentConfigs))}
    />
  )
}
