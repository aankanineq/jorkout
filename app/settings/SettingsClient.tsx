'use client'

import { useState, useTransition } from 'react'
import { updateTM } from '@/app/actions/liftConfig'
import { updateWeightPresets, updateExercise, deleteExercise, createExercise } from '@/app/actions/exercise'
import { createBodyLog } from '@/app/actions/bodyLog'
import { useRouter } from 'next/navigation'

type Config = {
  id: string
  liftType: string
  tm: number
  cycleWeek: string
  weekLabel: string
  tmIncrement: number
}

type Exercise = {
  id: string
  name: string
  liftType: string
  role: string
  order: number
  targetSets: number
  targetMinReps: number
  targetMaxReps: number
  availableWeights: number[]
}

const LIFT_ORDER = ['BENCH', 'SQUAT', 'OHP', 'DEAD']
const LIFT_NAMES: Record<string, string> = {
  BENCH: 'Bench Day', SQUAT: 'Squat Day', OHP: 'OHP Day', DEAD: 'Dead Day',
}

export function SettingsClient({
  configs, exercises,
}: {
  configs: Config[]
  exercises: Exercise[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingTM, setEditingTM] = useState<Record<string, string>>({})
  const [newWeight, setNewWeight] = useState<Record<string, string>>({})

  const grouped = LIFT_ORDER.map((lt) => ({
    liftType: lt,
    config: configs.find((c) => c.liftType === lt),
    exercises: exercises.filter((e) => e.liftType === lt),
  }))

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">설정</h1>

      {/* TM 설정 */}
      <section className="space-y-2">
        <h2 className="text-sm text-white/60 font-medium">5/3/1 Training Max</h2>
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          {grouped.map(({ liftType, config }) => {
            if (!config) return null
            return (
              <div key={liftType} className="flex items-center gap-3">
                <span className="text-sm w-16">{liftType}</span>
                <input
                  type="number"
                  step="5"
                  value={editingTM[liftType] ?? config.tm}
                  onChange={(e) => setEditingTM({ ...editingTM, [liftType]: e.target.value })}
                  className="bg-white/10 rounded px-2 py-1 w-20 text-sm text-center"
                />
                <span className="text-xs text-white/40">kg</span>
                <span className="text-xs text-white/30">{config.weekLabel}</span>
                {editingTM[liftType] && Number(editingTM[liftType]) !== config.tm && (
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        await updateTM(liftType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD', Number(editingTM[liftType]))
                        setEditingTM((prev) => { const n = { ...prev }; delete n[liftType]; return n })
                        router.refresh()
                      })
                    }}
                    className="text-xs bg-white/10 rounded px-2 py-0.5"
                  >
                    저장
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 운동 라이브러리 */}
      <section className="space-y-2">
        <h2 className="text-sm text-white/60 font-medium">운동 라이브러리</h2>
        {grouped.map(({ liftType, exercises: exs }) => (
          <div key={liftType} className="bg-white/5 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm">{LIFT_NAMES[liftType]}</h3>
            {exs.map((ex) => (
              <div key={ex.id} className="space-y-1 border-b border-white/5 pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {ex.name} <span className="text-white/30 text-xs">({ex.role})</span>
                  </span>
                  <span className="text-xs text-white/30">
                    {ex.targetSets}×{ex.targetMinReps}-{ex.targetMaxReps}
                  </span>
                </div>
                {ex.role !== 'MAIN' && (
                  <div className="flex flex-wrap gap-1 items-center">
                    {ex.availableWeights.map((w) => (
                      <span key={w} className="bg-white/10 rounded px-1.5 py-0.5 text-xs">
                        {w === 0 ? 'BW' : w}
                      </span>
                    ))}
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        type="number"
                        step="2.5"
                        value={newWeight[ex.id] ?? ''}
                        onChange={(e) => setNewWeight({ ...newWeight, [ex.id]: e.target.value })}
                        placeholder="+"
                        className="bg-white/10 rounded px-1 py-0.5 w-12 text-xs text-center"
                      />
                      {newWeight[ex.id] && (
                        <button
                          onClick={() => {
                            const w = Number(newWeight[ex.id])
                            if (!w && w !== 0) return
                            const updated = [...ex.availableWeights, w]
                            startTransition(async () => {
                              await updateWeightPresets(ex.id, updated)
                              setNewWeight((prev) => { const n = { ...prev }; delete n[ex.id]; return n })
                              router.refresh()
                            })
                          }}
                          className="text-xs bg-white/10 rounded px-1 py-0.5"
                        >
                          추가
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  )
}
