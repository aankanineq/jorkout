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
  const [editingSetsReps, setEditingSetsReps] = useState<Record<string, { sets: string; minReps: string; maxReps: string }>>({})

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
        <h2 className="text-sm text-muted-foreground font-medium font-medium">5/3/1 Training Max</h2>
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
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
                  className="bg-muted border border-border/50 rounded px-2 py-1 w-20 text-sm text-center"
                />
                <span className="text-xs text-muted-foreground/80">kg</span>
                <span className="text-xs text-muted-foreground/60">{config.weekLabel}</span>
                {editingTM[liftType] && Number(editingTM[liftType]) !== config.tm && (
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        await updateTM(liftType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD', Number(editingTM[liftType]))
                        setEditingTM((prev) => { const n = { ...prev }; delete n[liftType]; return n })
                        router.refresh()
                      })
                    }}
                    className="text-xs bg-muted border border-border/50 rounded px-2 py-0.5"
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
        <h2 className="text-sm text-muted-foreground font-medium font-medium">운동 라이브러리</h2>
        {grouped.map(({ liftType, exercises: exs }) => (
          <div key={liftType} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm">{LIFT_NAMES[liftType]}</h3>
            {exs.map((ex) => (
              <div key={ex.id} className="space-y-1 border-b border-white/5 pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {ex.name} <span className="text-muted-foreground/60 text-xs">({ex.role})</span>
                  </span>
                  {editingSetsReps[ex.id] ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editingSetsReps[ex.id].sets}
                        onChange={(e) => setEditingSetsReps((prev) => ({ ...prev, [ex.id]: { ...prev[ex.id], sets: e.target.value } }))}
                        className="bg-muted border border-border/50 rounded px-1 py-0.5 w-10 text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground">×</span>
                      <input
                        type="number"
                        value={editingSetsReps[ex.id].minReps}
                        onChange={(e) => setEditingSetsReps((prev) => ({ ...prev, [ex.id]: { ...prev[ex.id], minReps: e.target.value } }))}
                        className="bg-muted border border-border/50 rounded px-1 py-0.5 w-10 text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <input
                        type="number"
                        value={editingSetsReps[ex.id].maxReps}
                        onChange={(e) => setEditingSetsReps((prev) => ({ ...prev, [ex.id]: { ...prev[ex.id], maxReps: e.target.value } }))}
                        className="bg-muted border border-border/50 rounded px-1 py-0.5 w-10 text-xs text-center"
                      />
                      <button
                        onClick={() => {
                          const { sets, minReps, maxReps } = editingSetsReps[ex.id]
                          startTransition(async () => {
                            await updateExercise(ex.id, {
                              targetSets: Number(sets),
                              targetMinReps: Number(minReps),
                              targetMaxReps: Number(maxReps),
                            })
                            setEditingSetsReps((prev) => { const n = { ...prev }; delete n[ex.id]; return n })
                            router.refresh()
                          })
                        }}
                        className="text-xs bg-muted border border-border/50 rounded px-1.5 py-0.5"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingSetsReps((prev) => { const n = { ...prev }; delete n[ex.id]; return n })}
                        className="text-xs text-muted-foreground/60 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingSetsReps((prev) => ({
                        ...prev,
                        [ex.id]: { sets: String(ex.targetSets), minReps: String(ex.targetMinReps), maxReps: String(ex.targetMaxReps) },
                      }))}
                      className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      {ex.targetSets}×{ex.targetMinReps}-{ex.targetMaxReps}
                    </button>
                  )}
                </div>
                {ex.role !== 'MAIN' && (
                  <div className="flex flex-wrap gap-1 items-center">
                    {ex.availableWeights.map((w, i) => (
                      <span key={i} className="bg-muted border border-border/50 rounded px-1.5 py-0.5 text-xs flex items-center gap-0.5">
                        {w === 0 ? 'BW' : w}
                        <button
                          onClick={() => {
                            const updated = ex.availableWeights.filter((_, idx) => idx !== i)
                            startTransition(async () => {
                              await updateWeightPresets(ex.id, updated)
                              router.refresh()
                            })
                          }}
                          className="text-muted-foreground/40 hover:text-foreground ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        type="number"
                        step="2.5"
                        value={newWeight[ex.id] ?? ''}
                        onChange={(e) => setNewWeight({ ...newWeight, [ex.id]: e.target.value })}
                        placeholder="+"
                        className="bg-muted border border-border/50 rounded px-1 py-0.5 w-12 text-xs text-center"
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
                          className="text-xs bg-muted border border-border/50 rounded px-1 py-0.5"
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
