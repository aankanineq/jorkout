// Equipment types: BARBELL | DUMBBELL | CABLE | BODYWEIGHT | MANUAL

export type BarbellConfig = { barWeight: number; platesPerSide: number[] }
export type DumbbellConfig = { weights: number[] }
export type CableConfig = { min: number; max: number; step: number }
export type BodyweightConfig = { extraWeights: number[] } // 0 = BW only, plus any added weights (weighted pullups etc)

export type EquipmentData = BarbellConfig | DumbbellConfig | CableConfig | BodyweightConfig

export const EQUIPMENT_LABELS: Record<string, string> = {
  BARBELL: '바벨',
  DUMBBELL: '덤벨',
  CABLE: '케이블',
  BODYWEIGHT: '맨몸',
  MANUAL: '직접입력',
}

export function computeAvailableWeights(
  equipmentType: string,
  configs: { type: string; data: unknown }[],
): number[] {
  const config = configs.find((c) => c.type === equipmentType)
  if (!config) return []

  switch (equipmentType) {
    case 'BARBELL': {
      const { barWeight, platesPerSide } = config.data as BarbellConfig
      // Compute all possible subset sums of plates per side
      const sums = new Set<number>([0])
      for (const plate of platesPerSide) {
        const current = [...sums]
        for (const s of current) {
          sums.add(s + plate)
        }
      }
      return [...sums].sort((a, b) => a - b).map((s) => barWeight + 2 * s)
    }
    case 'DUMBBELL': {
      const { weights } = config.data as DumbbellConfig
      return [...weights].sort((a, b) => a - b)
    }
    case 'CABLE': {
      const { min, max, step } = config.data as CableConfig
      const weights: number[] = []
      for (let w = min; w <= max; w += step) {
        weights.push(w)
      }
      return weights
    }
    case 'BODYWEIGHT': {
      const { extraWeights } = config.data as BodyweightConfig
      return [0, ...extraWeights.filter((w) => w > 0)].sort((a, b) => a - b)
    }
    default:
      return []
  }
}

// Default configs matching user's equipment
export const DEFAULT_EQUIPMENT_CONFIGS = [
  {
    type: 'BARBELL',
    data: { barWeight: 20, platesPerSide: [20, 15, 10, 5, 5, 2.5] },
  },
  {
    type: 'DUMBBELL',
    data: { weights: [3, 5, 6, 8, 10, 12, 13, 15, 18, 20] },
  },
  {
    type: 'CABLE',
    data: { min: 5, max: 60, step: 5 },
  },
  {
    type: 'BODYWEIGHT',
    data: { extraWeights: [5, 10, 15, 20] },
  },
]
