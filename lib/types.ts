// ============================================================
// DB 모델 타입
// ============================================================

export type Run = {
  id: string
  date: Date
  km: number
  minutes: number
  pace: number | null
  createdAt: Date
  updatedAt: Date
}

export type Gym = {
  id: string
  date: Date
  exercise: string
  sets: number
  reps: number
  weight: number
  volume: number | null
  rpe: number | null
  memo: string | null
  raw: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// 파서 타입
// ============================================================

export type ParsedRun = {
  type: 'RUN'
  date: string        // YYYY-MM-DD
  km: number
  minutes: number
  pace: number        // minutes / km
}

export type ParsedGym = {
  type: 'GYM'
  date: string
  exercise: string
  sets: number
  reps: number
  weight: number
  volume: number      // sets × reps × weight
  rpe: number | null
  memo: string | null
  raw: string
}

export type ParsedDel = {
  type: 'DEL'
  category: 'run' | 'gym'
  date: string
  id?: string
}

export type ParsedRecord = ParsedRun | ParsedGym | ParsedDel

export type ParseError = {
  line: number
  raw: string
  reason: string
}

export type ParseResult = {
  records: ParsedRecord[]
  errors: ParseError[]
}

// ============================================================
// API 응답 타입
// ============================================================

export type RunSummary = {
  totalKm: number
  totalMin: number
  activeDays: number
  streak: number
}

export type GymSummary = {
  totalExercises: number
  totalVolume: number
  activeDays: number
  streak: number
}

export type ApiDataResponse = {
  run: {
    id: string
    date: string
    km: number
    minutes: number
    pace: number | null
  }[]
  gym: {
    id: string
    date: string
    exercise: string
    sets: number
    reps: number
    weight: number
    volume: number | null
    rpe: number | null
    memo: string | null
  }[]
  summary: {
    run: RunSummary
    gym: GymSummary
  }
}

// ============================================================
// 히트맵 타입
// ============================================================

export type HeatmapCategory = 'run' | 'gym'

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4
