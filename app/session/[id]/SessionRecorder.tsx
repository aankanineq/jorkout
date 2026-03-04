'use client'

import { useState, useTransition } from 'react'
import { saveSet, deleteSet } from '@/app/actions/liftSession'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ExerciseSet = {
  id: string
  setNumber: number
  weight: number
  reps: number
  isWarmup: boolean
}

type ExerciseLog = {
  id: string
  exerciseId: string
  order: number
  exercise: {
    id: string
    name: string
    role: string
    targetSets: number
    targetMinReps: number
    targetMaxReps: number
    availableWeights: number[]
  }
  sets: ExerciseSet[]
}

type Session = {
  id: string
  liftType: string
  date: string
  exerciseLogs: ExerciseLog[]
}

type Config = {
  tm: number
  cycleWeek: string
  weekLabel: string
  mainSets: { weight: number; reps: string | number; percentage: number }[]
  bbbWeight: number
}

const LIFT_NAMES: Record<string, string> = {
  BENCH: 'Bench', SQUAT: 'Squat', OHP: 'OHP', DEAD: 'Dead',
}

export function SessionRecorder({
  session,
  config,
  previousSets,
  onComplete,
}: {
  session: Session
  config: Config
  previousSets: Record<string, ExerciseSet[]>
  onComplete: () => Promise<void>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSaveSet(logId: string, data: { setId?: string; setNumber: number; weight: number; reps: number; isWarmup?: boolean }) {
    startTransition(async () => {
      await saveSet(logId, data)
      router.refresh()
    })
  }

  function handleDeleteSet(setId: string) {
    startTransition(async () => {
      await deleteSet(setId)
      router.refresh()
    })
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-muted-foreground/80">← 홈</Link>
        <h1 className="font-bold">{LIFT_NAMES[session.liftType]} Day · {config.weekLabel}</h1>
        <div className="w-6" />
      </div>

      {session.exerciseLogs.map((log) => {
        const isMain = log.exercise.role === 'MAIN'
        const prev = previousSets[log.exerciseId] || []

        return (
          <section key={log.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">
                {log.order + 1}. {log.exercise.name}
                {isMain && ' (5/3/1)'}
              </h3>
              {!isMain && prev.length > 0 && (
                <span className="text-xs text-muted-foreground/60">
                  지난번: {prev.map((s) => `${s.weight}×${s.reps}`).join(', ')}
                </span>
              )}
            </div>

            {/* 메인 리프트 — 5/3/1 세트 표시 */}
            {isMain && (
              <div className="space-y-2">
                {config.mainSets.map((ms, i) => {
                  const existingSet = log.sets.find((s) => s.setNumber === i + 1)
                  return (
                    <MainSetRow
                      key={i}
                      setNumber={i + 1}
                      targetWeight={ms.weight}
                      targetReps={ms.reps}
                      percentage={ms.percentage}
                      existingSet={existingSet}
                      logId={log.id}
                      onSave={handleSaveSet}
                      isAmrap={typeof ms.reps === 'string' && ms.reps.includes('+')}
                    />
                  )
                })}
                {/* BBB 세트 */}
                <div className="pt-2 border-t border-white/10">
                  <div className="text-sm text-muted-foreground mb-2">BBB 5×10 @ {config.bbbWeight}kg</div>
                  <BBBSets
                    logId={log.id}
                    weight={config.bbbWeight}
                    existingSets={log.sets.filter((s) => s.setNumber > 3)}
                    onSave={handleSaveSet}
                  />
                </div>
              </div>
            )}

            {/* 보조 운동 */}
            {!isMain && (
              <AccessorySets
                log={log}
                onSave={handleSaveSet}
                onDelete={handleDeleteSet}
              />
            )}
          </section>
        )
      })}

      <button
        onClick={() => {
          startTransition(async () => {
            await onComplete()
          })
        }}
        className="w-full bg-foreground text-background font-bold py-3 rounded-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
      >
        세션 완료
      </button>
    </div>
  )
}

function MainSetRow({
  setNumber, targetWeight, targetReps, percentage, existingSet, logId, onSave, isAmrap,
}: {
  setNumber: number
  targetWeight: number
  targetReps: string | number
  percentage: number
  existingSet?: ExerciseSet
  logId: string
  onSave: (logId: string, data: { setId?: string; setNumber: number; weight: number; reps: number }) => void
  isAmrap: boolean
}) {
  const baseRep = typeof targetReps === 'string' ? parseInt(targetReps) : targetReps
  const [reps, setReps] = useState(existingSet?.reps ?? baseRep)
  const done = !!existingSet
  const [editing, setEditing] = useState(false)
  const locked = done && !editing

  return (
    <div className={`flex items-center gap-3 ${locked ? 'opacity-50' : ''}`}>
      <span className="text-xs text-muted-foreground/60 w-8">Set {setNumber}</span>
      <span className="font-mono text-sm">{targetWeight}kg</span>
      <span className="text-xs text-muted-foreground/80">({percentage}%)</span>

      <div className="flex-1" />

      {/* 횟수 칸: -/숫자/+ */}
      <div className="flex items-center gap-0.5">
        <button
          disabled={locked}
          onClick={() => setReps(Math.max(1, reps - 1))}
          className="w-7 h-9 flex items-center justify-center rounded-l-lg bg-muted border border-border/50 text-sm text-muted-foreground disabled:opacity-30"
        >
          -
        </button>
        <div className="w-10 h-9 flex items-center justify-center bg-muted border-y border-border/50 font-mono text-sm font-bold">
          {reps}
        </div>
        <button
          disabled={locked}
          onClick={() => setReps(reps + 1)}
          className="w-7 h-9 flex items-center justify-center rounded-r-lg bg-muted border border-border/50 text-sm text-muted-foreground disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* 완료/수정 버튼 */}
      <button
        onClick={() => {
          if (locked) {
            setEditing(true)
          } else {
            onSave(logId, {
              setId: existingSet?.id,
              setNumber,
              weight: targetWeight,
              reps,
            })
            setEditing(false)
          }
        }}
        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
          locked
            ? 'bg-foreground/20 text-foreground'
            : 'bg-foreground text-background'
        }`}
      >
        O
      </button>
    </div>
  )
}

function BBBSetRow({
  setNumber, weight, existingSet, logId, onSave,
}: {
  setNumber: number
  weight: number
  existingSet?: ExerciseSet
  logId: string
  onSave: (logId: string, data: { setId?: string; setNumber: number; weight: number; reps: number }) => void
}) {
  const [reps, setReps] = useState(existingSet?.reps ?? 10)
  const done = !!existingSet
  const [editing, setEditing] = useState(false)
  const locked = done && !editing

  return (
    <div className={`flex items-center gap-2 ${locked ? 'opacity-50' : ''}`}>
      <span className="text-xs text-muted-foreground/60 w-8">Set {setNumber - 3}</span>
      <span className="font-mono text-sm">{weight}kg</span>

      <div className="flex-1" />

      <div className="flex items-center gap-0.5">
        <button
          disabled={locked}
          onClick={() => setReps(Math.max(1, reps - 1))}
          className="w-7 h-9 flex items-center justify-center rounded-l-lg bg-muted border border-border/50 text-sm text-muted-foreground disabled:opacity-30"
        >
          -
        </button>
        <div className="w-10 h-9 flex items-center justify-center bg-muted border-y border-border/50 font-mono text-sm font-bold">
          {reps}
        </div>
        <button
          disabled={locked}
          onClick={() => setReps(reps + 1)}
          className="w-7 h-9 flex items-center justify-center rounded-r-lg bg-muted border border-border/50 text-sm text-muted-foreground disabled:opacity-30"
        >
          +
        </button>
      </div>

      <button
        onClick={() => {
          if (locked) {
            setEditing(true)
          } else {
            onSave(logId, { setId: existingSet?.id, setNumber, weight, reps })
            setEditing(false)
          }
        }}
        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
          locked ? 'bg-foreground/20 text-foreground' : 'bg-foreground text-background'
        }`}
      >
        O
      </button>
    </div>
  )
}

function BBBSets({
  logId, weight, existingSets, onSave,
}: {
  logId: string
  weight: number
  existingSets: ExerciseSet[]
  onSave: (logId: string, data: { setId?: string; setNumber: number; weight: number; reps: number }) => void
}) {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => {
        const setNum = i + 3
        const existingSet = existingSets.find((s) => s.setNumber === setNum)
        return (
          <BBBSetRow
            key={i}
            setNumber={setNum}
            weight={weight}
            existingSet={existingSet}
            logId={logId}
            onSave={onSave}
          />
        )
      })}
    </div>
  )
}

function AccessorySetRow({
  setNumber, defaultWeight, defaultReps, existingSet, logId, onSave, availableWeights,
}: {
  setNumber: number
  defaultWeight: number
  defaultReps: number
  existingSet?: ExerciseSet
  logId: string
  onSave: (logId: string, data: { setId?: string; setNumber: number; weight: number; reps: number }) => void
  availableWeights: number[]
}) {
  const [weight, setWeight] = useState(existingSet?.weight ?? defaultWeight)
  const [reps, setReps] = useState(existingSet?.reps ?? defaultReps)
  const [showWeights, setShowWeights] = useState(false)
  const done = !!existingSet
  const [editing, setEditing] = useState(false)
  const locked = done && !editing

  return (
    <div className="space-y-1.5">
      <div className={`flex items-center gap-2 ${locked ? 'opacity-50' : ''}`}>
        <span className="text-xs text-muted-foreground/60 w-8">Set {setNumber}</span>

        {/* 무게 (탭하면 변경 가능) */}
        <button
          disabled={locked}
          onClick={() => setShowWeights(!showWeights)}
          className="font-mono text-sm hover:text-foreground transition-colors disabled:opacity-60"
        >
          {weight === 0 ? 'BW' : `${weight}kg`}
        </button>

        <div className="flex-1" />

        {/* 횟수 칸 */}
        <div className="flex items-center gap-0.5">
          <button
            disabled={locked}
            onClick={() => setReps(Math.max(1, reps - 1))}
            className="w-7 h-9 flex items-center justify-center rounded-l-lg bg-muted border border-border/50 text-sm text-muted-foreground disabled:opacity-30"
          >
            -
          </button>
          <div className="w-10 h-9 flex items-center justify-center bg-muted border-y border-border/50 font-mono text-sm font-bold">
            {reps}
          </div>
          <button
            disabled={locked}
            onClick={() => setReps(reps + 1)}
            className="w-7 h-9 flex items-center justify-center rounded-r-lg bg-muted border border-border/50 text-sm text-muted-foreground disabled:opacity-30"
          >
            +
          </button>
        </div>

        {/* 완료/수정 버튼 */}
        <button
          onClick={() => {
            if (locked) {
              setEditing(true)
            } else {
              onSave(logId, { setId: existingSet?.id, setNumber, weight, reps })
              setEditing(false)
            }
          }}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
            locked
              ? 'bg-foreground/20 text-foreground'
              : 'bg-foreground text-background'
          }`}
        >
          O
        </button>
      </div>

      {/* 무게 선택 팝업 */}
      {showWeights && !locked && availableWeights.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-8">
          {availableWeights.map((w) => (
            <button
              key={w}
              onClick={() => { setWeight(w); setShowWeights(false) }}
              className={`px-2 py-1 rounded text-xs ${weight === w ? 'bg-foreground text-background' : 'bg-muted border border-border/50'}`}
            >
              {w === 0 ? 'BW' : w}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AccessorySets({
  log, onSave, onDelete,
}: {
  log: ExerciseLog
  onSave: (logId: string, data: { setId?: string; setNumber: number; weight: number; reps: number }) => void
  onDelete: (setId: string) => void
}) {
  const target = `${log.exercise.targetSets}x${log.exercise.targetMinReps}-${log.exercise.targetMaxReps}`
  const defaultWeight = log.sets[0]?.weight ?? log.exercise.availableWeights[0] ?? 0

  const allMaxed = log.sets.length >= log.exercise.targetSets &&
    log.sets.every((s) => s.reps >= log.exercise.targetMaxReps)

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground/80">목표: {target}</div>

      {Array.from({ length: log.exercise.targetSets }, (_, i) => {
        const setNum = i + 1
        const existingSet = log.sets.find((s) => s.setNumber === setNum)
        return (
          <AccessorySetRow
            key={i}
            setNumber={setNum}
            defaultWeight={defaultWeight}
            defaultReps={log.exercise.targetMaxReps}
            existingSet={existingSet}
            logId={log.id}
            onSave={onSave}
            availableWeights={log.exercise.availableWeights}
          />
        )
      })}

      {allMaxed && (
        <div className="text-xs text-yellow-400">모든 세트 목표 달성! +5kg 도전?</div>
      )}
    </div>
  )
}
