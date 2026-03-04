'use client'

import { useState, useTransition } from 'react'
import { saveSet, deleteSet, deleteSession } from '@/app/actions/liftSession'
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
}: {
  session: Session
  config: Config
  previousSets: Record<string, ExerciseSet[]>
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

  function handleDeleteSession() {
    if (!confirm('세션을 삭제하시겠습니까?')) return
    startTransition(async () => {
      await deleteSession(session.id)
    })
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-muted-foreground/80">← 홈</Link>
        <h1 className="font-bold">{LIFT_NAMES[session.liftType]} Day · {config.weekLabel}</h1>
        <button onClick={handleDeleteSession} className="text-red-400 text-sm">삭제</button>
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

      <Link href="/" className="block text-center bg-foreground text-background font-bold py-3 rounded-lg">
        세션 완료
      </Link>
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
  const [reps, setReps] = useState(existingSet?.reps?.toString() ?? '')
  const done = !!existingSet

  return (
    <div className={`flex items-center gap-3 ${done ? 'opacity-60' : ''}`}>
      <span className="text-xs text-muted-foreground/60 w-8">Set {setNumber}</span>
      <span className="font-mono text-sm">{targetWeight}kg</span>
      <span className="text-xs text-muted-foreground/80">({percentage}%)</span>
      <span className="text-xs text-muted-foreground/80">×{targetReps}</span>
      <div className="flex-1" />
      {isAmrap || !done ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="렙"
            className="bg-muted border border-border/50 rounded px-2 py-1 w-14 text-sm text-center"
          />
          <button
            onClick={() => {
              if (!reps) return
              onSave(logId, {
                setId: existingSet?.id,
                setNumber,
                weight: targetWeight,
                reps: Number(reps),
              })
            }}
            className="text-sm bg-muted border border-border/50 rounded px-2 py-1"
          >
            ✅
          </button>
        </div>
      ) : (
        <span className="text-sm text-green-400">✅ {existingSet.reps}렙</span>
      )}
    </div>
  )
}

function BBBSets({
  logId, weight, existingSets, onSave,
}: {
  logId: string
  weight: number
  existingSets: ExerciseSet[]
  onSave: (logId: string, data: { setNumber: number; weight: number; reps: number }) => void
}) {
  const completedCount = existingSets.length

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((i) => {
        const setNum = i + 3 // BBB starts at set 4
        const done = existingSets.some((s) => s.setNumber === setNum)
        return (
          <button
            key={i}
            onClick={() => {
              if (!done) onSave(logId, { setNumber: setNum, weight, reps: 10 })
            }}
            className={`w-8 h-8 rounded text-sm ${done ? 'bg-green-500/30 text-green-400' : 'bg-muted border border-border/50 text-muted-foreground/80'}`}
          >
            {done ? '✅' : i}
          </button>
        )
      })}
      <span className="text-xs text-muted-foreground/60 ml-2">{completedCount}/5</span>
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
  const [selectedWeight, setSelectedWeight] = useState<number>(
    log.sets[0]?.weight ?? log.exercise.availableWeights[0] ?? 0
  )
  const [reps, setReps] = useState('')

  const target = `${log.exercise.targetSets}×${log.exercise.targetMinReps}-${log.exercise.targetMaxReps}`
  const nextSetNum = (log.sets.at(-1)?.setNumber ?? 0) + 1

  // Check if all sets hit max reps → suggest +5kg
  const allMaxed = log.sets.length >= log.exercise.targetSets &&
    log.sets.every((s) => s.reps >= log.exercise.targetMaxReps)

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground/80">목표: {target}</div>

      {/* 기록된 세트 */}
      {log.sets.map((s) => (
        <div key={s.id} className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground/60 w-12">Set {s.setNumber}</span>
          <span className="font-mono">{s.weight}kg × {s.reps}</span>
          <button onClick={() => onDelete(s.id)} className="text-red-400/60 text-xs ml-auto">✕</button>
        </div>
      ))}

      {allMaxed && (
        <div className="text-xs text-yellow-400">모든 세트 목표 달성! +5kg 도전?</div>
      )}

      {/* 무게 선택 + 렙 입력 */}
      {log.sets.length < log.exercise.targetSets + 2 && (
        <div className="space-y-2">
          {log.exercise.availableWeights.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {log.exercise.availableWeights.map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWeight(w)}
                  className={`px-2 py-1 rounded text-xs ${selectedWeight === w ? 'bg-foreground text-background' : 'bg-muted border border-border/50'}`}
                >
                  {w === 0 ? 'BW' : w}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            {log.exercise.availableWeights.length === 0 && (
              <input
                type="number"
                value={selectedWeight || ''}
                onChange={(e) => setSelectedWeight(Number(e.target.value))}
                placeholder="무게"
                className="bg-muted border border-border/50 rounded px-2 py-1 w-16 text-sm"
              />
            )}
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="렙"
              className="bg-muted border border-border/50 rounded px-2 py-1 w-14 text-sm"
            />
            <button
              onClick={() => {
                if (!reps) return
                onSave(log.id, {
                  setNumber: nextSetNum,
                  weight: selectedWeight,
                  reps: Number(reps),
                })
                setReps('')
              }}
              className="bg-muted border border-border/50 rounded px-3 py-1 text-sm"
            >
              + 세트
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
