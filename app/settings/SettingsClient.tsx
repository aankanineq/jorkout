'use client'

import { useState, useTransition } from 'react'
import { updateTM, syncCycleWeeks, updateNickname, updateFatigueLoad } from '@/app/actions/liftConfig'
import { DEFAULT_LOAD_TABLE } from '@/lib/fatigueDefaults'
import { updateWeightPresets, updateExercise, deleteExercise, createExercise, swapExerciseOrder } from '@/app/actions/exercise'
import { upsertEquipmentConfig } from '@/app/actions/equipment'
import { createBodyLog } from '@/app/actions/bodyLog'
import { useRouter } from 'next/navigation'
import { EQUIPMENT_LABELS, computeAvailableWeights } from '@/lib/equipment'
import type { BarbellConfig, DumbbellConfig, CableConfig, BodyweightConfig } from '@/lib/equipment'

type FatigueLoad = { push: number; pull: number; quad: number; post: number; cardio: number }

type Config = {
  id: string
  liftType: string
  nickname: string | null
  fatigueLoad: FatigueLoad | null
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
  equipmentType: string
  availableWeights: number[]
}

type EquipmentConfigRow = {
  id: string
  type: string
  data: unknown
}

const LIFT_ORDER = ['BENCH', 'SQUAT', 'OHP', 'DEAD']
const LIFT_NAMES: Record<string, string> = {
  BENCH: 'Bench Day', SQUAT: 'Squat Day', OHP: 'OHP Day', DEAD: 'Dead Day',
}
const ROLE_OPTIONS = ['MAIN', 'BBB', 'ACCESSORY']
const EQUIPMENT_OPTIONS = ['BARBELL', 'DUMBBELL', 'CABLE', 'BODYWEIGHT', 'MANUAL']

export function SettingsClient({
  configs, exercises, equipmentConfigs,
}: {
  configs: Config[]
  exercises: Exercise[]
  equipmentConfigs: EquipmentConfigRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingTM, setEditingTM] = useState<Record<string, string>>({})
  const [newWeight, setNewWeight] = useState<Record<string, string>>({})
  const [editingSetsReps, setEditingSetsReps] = useState<Record<string, { sets: string; minReps: string; maxReps: string }>>({})
  const [editingExercise, setEditingExercise] = useState<Record<string, { name: string; equipmentType: string; role: string }>>({})
  const [editingNickname, setEditingNickname] = useState<Record<string, string>>({})
  const [editingFatigue, setEditingFatigue] = useState<Record<string, FatigueLoad>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newExercise, setNewExercise] = useState({ name: '', role: 'ACCESSORY', equipmentType: 'DUMBBELL' })

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
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-muted-foreground font-medium">5/3/1 Training Max</h2>
          <button
            onClick={() => {
              if (!confirm('최근 완료된 운동 기록을 기반으로 사이클(5s/3s/1s/DEL) 주차를 다시 계산합니다. 진행하시겠습니까?')) return
              startTransition(async () => {
                await syncCycleWeeks()
              })
            }}
            disabled={isPending}
            className="text-xs text-muted-foreground/60 hover:text-foreground flex items-center gap-1 transition-colors disabled:opacity-50"
            title="최근 운동 기록 반영하기"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            새로고침
          </button>
        </div>
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
                <span className="bg-muted border border-border/50 rounded px-1.5 py-0.5 text-xs text-muted-foreground">
                  {config.weekLabel}
                </span>
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

      {/* 장비 설정 */}
      <EquipmentSection equipmentConfigs={equipmentConfigs} />

      {/* 운동 라이브러리 */}
      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground font-medium">운동 라이브러리</h2>
        {grouped.map(({ liftType, exercises: exs }) => (
          <div key={liftType} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              {editingNickname[liftType] !== undefined ? (
                <div className="flex items-center gap-1">
                  <input
                    value={editingNickname[liftType]}
                    onChange={(e) => setEditingNickname((prev) => ({ ...prev, [liftType]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        startTransition(async () => {
                          await updateNickname(liftType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD', editingNickname[liftType])
                          setEditingNickname((prev) => { const n = { ...prev }; delete n[liftType]; return n })
                          router.refresh()
                        })
                      } else if (e.key === 'Escape') {
                        setEditingNickname((prev) => { const n = { ...prev }; delete n[liftType]; return n })
                      }
                    }}
                    autoFocus
                    placeholder={LIFT_NAMES[liftType]}
                    className="bg-muted border border-border/50 rounded px-2 py-0.5 text-sm font-bold w-32"
                  />
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        await updateNickname(liftType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD', editingNickname[liftType])
                        setEditingNickname((prev) => { const n = { ...prev }; delete n[liftType]; return n })
                        router.refresh()
                      })
                    }}
                    disabled={isPending}
                    className="text-xs bg-muted border border-border/50 rounded px-2 py-0.5"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingNickname((prev) => { const n = { ...prev }; delete n[liftType]; return n })}
                    className="text-xs text-muted-foreground/60"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const config = configs.find((c) => c.liftType === liftType)
                    setEditingNickname((prev) => ({ ...prev, [liftType]: config?.nickname ?? '' }))
                  }}
                  className="font-bold text-sm hover:text-foreground/80 transition-colors"
                >
                  {configs.find((c) => c.liftType === liftType)?.nickname || LIFT_NAMES[liftType]}
                </button>
              )}
              <button
                onClick={() => {
                  setAddingTo(addingTo === liftType ? null : liftType)
                  setNewExercise({ name: '', role: 'ACCESSORY', equipmentType: 'DUMBBELL' })
                }}
                className="text-xs text-muted-foreground/60 hover:text-foreground"
              >
                {addingTo === liftType ? '취소' : '+ 추가'}
              </button>
            </div>

            {/* 피로도 배분 */}
            {(() => {
              const config = configs.find((c) => c.liftType === liftType)
              const current = (config?.fatigueLoad ?? DEFAULT_LOAD_TABLE[liftType]) as FatigueLoad
              const isEditing = editingFatigue[liftType] !== undefined
              const ZONES = ['push', 'pull', 'quad', 'post', 'cardio'] as const
              const ZONE_LABELS: Record<string, string> = { push: 'PUSH', pull: 'PULL', quad: 'QUAD', post: 'POST', cardio: 'CARDIO' }
              return isEditing ? (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border/50">
                  <div className="text-xs text-muted-foreground font-medium mb-1">피로도 배분</div>
                  <div className="grid grid-cols-5 gap-2">
                    {ZONES.map((z) => (
                      <div key={z} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground/60">{ZONE_LABELS[z]}</span>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={editingFatigue[liftType][z]}
                          onChange={(e) => setEditingFatigue((prev) => ({
                            ...prev,
                            [liftType]: { ...prev[liftType], [z]: Math.max(0, Math.min(5, Number(e.target.value) || 0)) },
                          }))}
                          className="bg-muted border border-border/50 rounded px-1 py-0.5 w-10 text-xs text-center"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => {
                        startTransition(async () => {
                          await updateFatigueLoad(liftType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD', editingFatigue[liftType])
                          setEditingFatigue((prev) => { const n = { ...prev }; delete n[liftType]; return n })
                          router.refresh()
                        })
                      }}
                      disabled={isPending}
                      className="text-xs bg-muted border border-border/50 rounded px-2 py-0.5"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditingFatigue((prev) => { const n = { ...prev }; delete n[liftType]; return n })}
                      className="text-xs text-muted-foreground/60"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingFatigue((prev) => ({ ...prev, [liftType]: { ...current } }))}
                  className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {ZONES.map((z) => (
                    <span key={z} className="flex items-center gap-0.5">
                      <span className="text-[10px]">{ZONE_LABELS[z]}</span>
                      <span>{current[z]}</span>
                    </span>
                  ))}
                </button>
              )
            })()}

            {addingTo === liftType && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border/50">
                <input
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  placeholder="운동 이름"
                  className="bg-muted border border-border/50 rounded px-2 py-1 text-sm w-full"
                />
                <div className="flex gap-2">
                  <select
                    value={newExercise.role}
                    onChange={(e) => setNewExercise({ ...newExercise, role: e.target.value })}
                    className="bg-muted border border-border/50 rounded px-2 py-1 text-xs flex-1"
                  >
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select
                    value={newExercise.equipmentType}
                    onChange={(e) => setNewExercise({ ...newExercise, equipmentType: e.target.value })}
                    className="bg-muted border border-border/50 rounded px-2 py-1 text-xs flex-1"
                  >
                    {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{EQUIPMENT_LABELS[eq]}</option>)}
                  </select>
                </div>
                <button
                  disabled={!newExercise.name.trim() || isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await createExercise({
                        name: newExercise.name.trim(),
                        liftType: liftType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD',
                        role: newExercise.role,
                        order: exs.length + 1,
                        targetSets: 3,
                        targetMinReps: 8,
                        targetMaxReps: 12,
                      })
                      setAddingTo(null)
                      router.refresh()
                    })
                  }}
                  className="text-xs bg-muted border border-border/50 rounded px-3 py-1 disabled:opacity-40"
                >
                  추가
                </button>
              </div>
            )}

            {exs.map((ex, idx) => (
              <div key={ex.id} className="space-y-1 border-b border-white/5 pb-2 last:border-0">
                {editingExercise[ex.id] ? (
                  <div className="space-y-2">
                    <input
                      value={editingExercise[ex.id].name}
                      onChange={(e) => setEditingExercise((prev) => ({ ...prev, [ex.id]: { ...prev[ex.id], name: e.target.value } }))}
                      className="bg-muted border border-border/50 rounded px-2 py-1 text-sm w-full"
                    />
                    <div className="flex gap-2">
                      <select
                        value={editingExercise[ex.id].role}
                        onChange={(e) => setEditingExercise((prev) => ({ ...prev, [ex.id]: { ...prev[ex.id], role: e.target.value } }))}
                        className="bg-muted border border-border/50 rounded px-2 py-1 text-xs flex-1"
                      >
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <select
                        value={editingExercise[ex.id].equipmentType}
                        onChange={(e) => setEditingExercise((prev) => ({ ...prev, [ex.id]: { ...prev[ex.id], equipmentType: e.target.value } }))}
                        className="bg-muted border border-border/50 rounded px-2 py-1 text-xs flex-1"
                      >
                        {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{EQUIPMENT_LABELS[eq]}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const { name, equipmentType, role } = editingExercise[ex.id]
                          startTransition(async () => {
                            await updateExercise(ex.id, { name, equipmentType, role })
                            setEditingExercise((prev) => { const n = { ...prev }; delete n[ex.id]; return n })
                            router.refresh()
                          })
                        }}
                        disabled={isPending}
                        className="text-xs bg-muted border border-border/50 rounded px-3 py-1"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingExercise((prev) => { const n = { ...prev }; delete n[ex.id]; return n })}
                        className="text-xs text-muted-foreground/60"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`"${ex.name}" 삭제?`)) return
                          startTransition(async () => {
                            await deleteExercise(ex.id)
                            setEditingExercise((prev) => { const n = { ...prev }; delete n[ex.id]; return n })
                            router.refresh()
                          })
                        }}
                        className="text-xs text-red-400/80 ml-auto"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <button
                            disabled={idx === 0 || isPending}
                            onClick={() => {
                              startTransition(async () => {
                                await swapExerciseOrder(ex.id, exs[idx - 1].id)
                                router.refresh()
                              })
                            }}
                            className="text-[10px] text-muted-foreground/40 hover:text-foreground disabled:opacity-20 leading-none"
                          >
                            ▲
                          </button>
                          <button
                            disabled={idx === exs.length - 1 || isPending}
                            onClick={() => {
                              startTransition(async () => {
                                await swapExerciseOrder(ex.id, exs[idx + 1].id)
                                router.refresh()
                              })
                            }}
                            className="text-[10px] text-muted-foreground/40 hover:text-foreground disabled:opacity-20 leading-none"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => setEditingExercise((prev) => ({
                            ...prev,
                            [ex.id]: { name: ex.name, equipmentType: ex.equipmentType, role: ex.role },
                          }))}
                          className="text-sm text-left hover:text-foreground/80 transition-colors"
                        >
                          {ex.name} <span className="text-muted-foreground/60 text-xs">({ex.role})</span>
                        </button>
                      </div>
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
                      <span className="text-xs text-muted-foreground/60">{EQUIPMENT_LABELS[ex.equipmentType] ?? ex.equipmentType}</span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  )
}

function EquipmentSection({ equipmentConfigs }: { equipmentConfigs: EquipmentConfigRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const barbellConfig = equipmentConfigs.find((c) => c.type === 'BARBELL')?.data as BarbellConfig | undefined
  const dumbbellConfig = equipmentConfigs.find((c) => c.type === 'DUMBBELL')?.data as DumbbellConfig | undefined
  const cableConfig = equipmentConfigs.find((c) => c.type === 'CABLE')?.data as CableConfig | undefined
  const bodyweightConfig = equipmentConfigs.find((c) => c.type === 'BODYWEIGHT')?.data as BodyweightConfig | undefined

  const [editingBarbell, setEditingBarbell] = useState(false)
  const [barbellPlates, setBarbellPlates] = useState(
    barbellConfig?.platesPerSide.join(', ') ?? '20, 15, 10, 5, 5, 2.5',
  )
  const [barbellBar, setBarbellBar] = useState(String(barbellConfig?.barWeight ?? 20))

  const [editingDumbbell, setEditingDumbbell] = useState(false)
  const [dumbbellWeights, setDumbbellWeights] = useState(
    dumbbellConfig?.weights.join(', ') ?? '3, 5, 6, 8, 10, 12, 13, 15, 18, 20',
  )

  const [editingCable, setEditingCable] = useState(false)
  const [cableMax, setCableMax] = useState(String(cableConfig?.max ?? 60))
  const [cableStep, setCableStep] = useState(String(cableConfig?.step ?? 5))

  const [editingBW, setEditingBW] = useState(false)
  const [bwExtraWeights, setBwExtraWeights] = useState(
    bodyweightConfig?.extraWeights.join(', ') ?? '5, 10, 15, 20',
  )

  function saveBarbell() {
    const plates = barbellPlates.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0)
    const bar = Number(barbellBar) || 20
    startTransition(async () => {
      await upsertEquipmentConfig('BARBELL', { barWeight: bar, platesPerSide: plates })
      setEditingBarbell(false)
      router.refresh()
    })
  }

  function saveDumbbell() {
    const weights = dumbbellWeights.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0)
    startTransition(async () => {
      await upsertEquipmentConfig('DUMBBELL', { weights })
      setEditingDumbbell(false)
      router.refresh()
    })
  }

  function saveCable() {
    startTransition(async () => {
      await upsertEquipmentConfig('CABLE', { min: Number(cableStep) || 5, max: Number(cableMax) || 60, step: Number(cableStep) || 5 })
      setEditingCable(false)
      router.refresh()
    })
  }

  function saveBW() {
    const weights = bwExtraWeights.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0)
    startTransition(async () => {
      await upsertEquipmentConfig('BODYWEIGHT', { extraWeights: weights })
      setEditingBW(false)
      router.refresh()
    })
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm text-muted-foreground font-medium">장비 설정</h2>
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        {/* Barbell */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">바벨</span>
            <button onClick={() => setEditingBarbell(!editingBarbell)} className="text-xs text-muted-foreground/60 hover:text-foreground">
              {editingBarbell ? '취소' : '수정'}
            </button>
          </div>
          {editingBarbell ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">봉</span>
                <input
                  type="number"
                  value={barbellBar}
                  onChange={(e) => setBarbellBar(e.target.value)}
                  className="bg-muted border border-border/50 rounded px-2 py-1 w-16 text-xs text-center"
                />
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">판</span>
                <input
                  value={barbellPlates}
                  onChange={(e) => setBarbellPlates(e.target.value)}
                  placeholder="20, 15, 10, 5, 5, 2.5"
                  className="bg-muted border border-border/50 rounded px-2 py-1 text-xs flex-1"
                />
              </div>
              <div className="text-xs text-muted-foreground/60">한쪽 기준, 쉼표로 구분 (같은 무게 여러장이면 반복)</div>
              <button onClick={saveBarbell} disabled={isPending} className="text-xs bg-muted border border-border/50 rounded px-3 py-1">
                저장
              </button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground/80">
              {barbellConfig
                ? `${barbellConfig.barWeight}kg 봉 + 한쪽 [${barbellConfig.platesPerSide.join(', ')}]kg`
                : '미설정'}
            </div>
          )}
        </div>

        {/* Dumbbell */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">덤벨</span>
            <button onClick={() => setEditingDumbbell(!editingDumbbell)} className="text-xs text-muted-foreground/60 hover:text-foreground">
              {editingDumbbell ? '취소' : '수정'}
            </button>
          </div>
          {editingDumbbell ? (
            <div className="space-y-2">
              <input
                value={dumbbellWeights}
                onChange={(e) => setDumbbellWeights(e.target.value)}
                placeholder="3, 5, 6, 8, 10, ..."
                className="bg-muted border border-border/50 rounded px-2 py-1 text-xs w-full"
              />
              <div className="text-xs text-muted-foreground/60">보유 중인 덤벨 무게, 쉼표로 구분</div>
              <button onClick={saveDumbbell} disabled={isPending} className="text-xs bg-muted border border-border/50 rounded px-3 py-1">
                저장
              </button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground/80">
              {dumbbellConfig
                ? `[${dumbbellConfig.weights.join(', ')}]kg`
                : '미설정'}
            </div>
          )}
        </div>

        {/* Cable */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">케이블</span>
            <button onClick={() => setEditingCable(!editingCable)} className="text-xs text-muted-foreground/60 hover:text-foreground">
              {editingCable ? '취소' : '수정'}
            </button>
          </div>
          {editingCable ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">단위</span>
                <input
                  type="number"
                  value={cableStep}
                  onChange={(e) => setCableStep(e.target.value)}
                  className="bg-muted border border-border/50 rounded px-2 py-1 w-16 text-xs text-center"
                />
                <span className="text-xs text-muted-foreground">kg, 최대</span>
                <input
                  type="number"
                  value={cableMax}
                  onChange={(e) => setCableMax(e.target.value)}
                  className="bg-muted border border-border/50 rounded px-2 py-1 w-16 text-xs text-center"
                />
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
              <button onClick={saveCable} disabled={isPending} className="text-xs bg-muted border border-border/50 rounded px-3 py-1">
                저장
              </button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground/80">
              {cableConfig
                ? `${cableConfig.step}kg 단위, 최대 ${cableConfig.max}kg`
                : '미설정'}
            </div>
          )}
        </div>

        {/* Bodyweight */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">맨몸 (추가 중량)</span>
            <button onClick={() => setEditingBW(!editingBW)} className="text-xs text-muted-foreground/60 hover:text-foreground">
              {editingBW ? '취소' : '수정'}
            </button>
          </div>
          {editingBW ? (
            <div className="space-y-2">
              <input
                value={bwExtraWeights}
                onChange={(e) => setBwExtraWeights(e.target.value)}
                placeholder="5, 10, 15, 20"
                className="bg-muted border border-border/50 rounded px-2 py-1 text-xs w-full"
              />
              <div className="text-xs text-muted-foreground/60">추가 중량 옵션 (웨이트 벨트 등), 쉼표로 구분</div>
              <button onClick={saveBW} disabled={isPending} className="text-xs bg-muted border border-border/50 rounded px-3 py-1">
                저장
              </button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground/80">
              {bodyweightConfig
                ? `BW + [${bodyweightConfig.extraWeights.join(', ')}]kg`
                : '미설정'}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

