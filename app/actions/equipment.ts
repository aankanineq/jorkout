'use server'

import { prisma } from '@/lib/prisma'
import { computeAvailableWeights, type EquipmentData } from '@/lib/equipment'
import { revalidatePath } from 'next/cache'

export async function getEquipmentConfigs() {
  return prisma.equipmentConfig.findMany()
}

export async function upsertEquipmentConfig(type: string, data: EquipmentData) {
  await prisma.equipmentConfig.upsert({
    where: { type },
    update: { data: data as object },
    create: { type, data: data as object },
  })

  // Sync all exercises of this equipment type
  await syncExerciseWeights(type)
  revalidatePath('/settings')
}

export async function updateExerciseEquipmentType(exerciseId: string, equipmentType: string) {
  // Get equipment configs
  const configs = await prisma.equipmentConfig.findMany()
  const weights = equipmentType === 'MANUAL'
    ? [] // manual stays as-is
    : computeAvailableWeights(equipmentType, configs)

  await prisma.exercise.update({
    where: { id: exerciseId },
    data: {
      equipmentType,
      ...(equipmentType !== 'MANUAL' ? { availableWeights: weights } : {}),
    },
  })
  revalidatePath('/settings')
}

async function syncExerciseWeights(equipmentType: string) {
  const configs = await prisma.equipmentConfig.findMany()
  const weights = computeAvailableWeights(equipmentType, configs)

  await prisma.exercise.updateMany({
    where: { equipmentType },
    data: { availableWeights: weights },
  })
}

export async function initEquipmentConfigs() {
  const { DEFAULT_EQUIPMENT_CONFIGS } = await import('@/lib/equipment')
  for (const config of DEFAULT_EQUIPMENT_CONFIGS) {
    await prisma.equipmentConfig.upsert({
      where: { type: config.type },
      update: {},
      create: { type: config.type, data: config.data as object },
    })
  }
}
