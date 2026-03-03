'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveSet } from '@/app/actions/liftSession'

const ROLE_LABEL: Record<string, string> = {
  MAIN: '메인',
  VOLUME: '볼륨',
}

const ROLE_COLOR: Record<string, string> = {
  MAIN: 'bg-amber-100 text-amber-700',
  VOLUME: 'bg-sky-100 text-sky-700',
}

const REST_SECONDS: Record<string, number> = {
  MAIN: 180,   // 3분
  VOLUME: 120, // 2분
}

type SetData = {
  id: string
  setNumber: number
  weight: number
  reps: number
  isWarmup: boolean
}

type ExerciseLogData = {
  id: string
  exerciseId: string
  exerciseName: string
  role: string
  targetSets: number
  targetMinReps: number
  targetMaxReps: number
  order: number
  sets: SetData[]
}

type SessionData = {
  id: string
  date: string
  splitType: string
  splitLabel: string
  exerciseLogs: ExerciseLogData[]
}

type PreviousSetData = { weight: number; reps: number }

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function playAlarm() {
  try {
    const ctx = new AudioContext()
    const playBeep = (time: number, freq: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, time)
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur)
      osc.start(time)
      osc.stop(time + dur)
    }
    // 3-beep pattern
    playBeep(ctx.currentTime, 880, 0.15)
    playBeep(ctx.currentTime + 0.2, 880, 0.15)
    playBeep(ctx.currentTime + 0.4, 1100, 0.3)
  } catch {
    // AudioContext not available
  }
}

export default function SessionRecorder({
  session,
  previousData = {},
  progressionInfo = {},
}: {
  session: SessionData
  previousData?: Record<string, PreviousSetData[]>
  progressionInfo?: Record<string, boolean>
}) {
  const router = useRouter()
  const [timerEnd, setTimerEnd] = useState<number | null>(null)
  const [timerTotal, setTimerTotal] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const alarmedRef = useRef(false)

  useEffect(() => {
    if (timerEnd === null) return
    alarmedRef.current = false

    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000))
      setRemaining(left)

      if (left === 0 && !alarmedRef.current) {
        alarmedRef.current = true
        playAlarm()
      }
    }, 200)

    return () => clearInterval(interval)
  }, [timerEnd])

  const startTimer = useCallback((role: string) => {
    const duration = REST_SECONDS[role] ?? 120
    setTimerTotal(duration)
    setRemaining(duration)
    setTimerEnd(Date.now() + duration * 1000)
  }, [])

  function dismissTimer() {
    setTimerEnd(null)
    setRemaining(0)
  }

  const dateStr = new Date(session.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const progress = timerTotal > 0 ? remaining / timerTotal : 0

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">세션 기록</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {dateStr} · {session.splitLabel}
          </p>
        </div>
        <button
          onClick={() => router.push('/lift')}
          className="text-sm px-4 py-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
        >
          완료
        </button>
      </div>

      {/* Exercise logs */}
      {session.exerciseLogs.map((log: any) => (
        <ExerciseCard
          key={log.id}
          log={log}
          previousSets={previousData[log.exerciseId]}
          canProgress={progressionInfo[log.exerciseId] ?? false}
          onSetSaved={startTimer}
        />
      ))}

      {/* Rest timer — fixed bottom bar */}
      {timerEnd !== null && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {/* Progress bar background */}
          <div className="relative bg-zinc-900">
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-200 ${remaining === 0 ? 'bg-emerald-600' : 'bg-indigo-600/30'}`}
              style={{ width: `${(1 - progress) * 100}%` }}
            />
            <div className="relative px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">쉬는 시간</span>
                <span className={`text-2xl font-bold tabular-nums ${remaining === 0 ? 'text-emerald-400' : remaining <= 10 ? 'text-amber-400' : 'text-white'}`}>
                  {formatTimer(remaining)}
                </span>
                {remaining === 0 && (
                  <span className="text-sm text-emerald-400 font-medium">GO!</span>
                )}
              </div>
              <button
                onClick={dismissTimer}
                className="text-sm px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseCard({
  log,
  previousSets,
  canProgress,
  onSetSaved,
}: {
  log: ExerciseLogData
  previousSets?: PreviousSetData[]
  canProgress: boolean
  onSetSaved: (role: string) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSaveSet(data: {
    setId?: string
    setNumber: number
    weight: number
    reps: number
  }) {
    startTransition(async () => {
      await saveSet(log.id, data)
      onSetSaved(log.role)
      router.refresh()
    })
  }

  // Build fixed rows based on targetSets
  const rows = Array.from({ length: log.targetSets }, (_, i) => {
    const setNumber = i + 1
    const existingSet = log.sets.find((s: any) => s.setNumber === setNumber)
    const prevSet = previousSets?.[i]
    const suggestedWeight = prevSet
      ? canProgress ? prevSet.weight + 5 : prevSet.weight
      : undefined
    return { setNumber, existingSet, prevSet, suggestedWeight }
  })

  return (
    <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">{log.exerciseName}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[log.role]}`}>
          {ROLE_LABEL[log.role]}
        </span>
        {canProgress && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
            +5kg
          </span>
        )}
      </div>

      {/* Sets grid */}
      <div className="space-y-0">
        {/* Column headers */}
        <div className="grid grid-cols-[24px_1fr_1fr_auto] gap-2 text-xs text-zinc-400 pb-1.5 border-b border-zinc-200">
          <span></span>
          <span>지난 세션</span>
          <span>이번 세션</span>
          <span className="w-12"></span>
        </div>

        {rows.map((row) => (
          <FixedSetRow
            key={row.setNumber}
            setNumber={row.setNumber}
            existingSet={row.existingSet}
            prevSet={row.prevSet}
            suggestedWeight={row.suggestedWeight}
            targetMinReps={log.targetMinReps}
            targetMaxReps={log.targetMaxReps}
            onSave={handleSaveSet}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  )
}

function FixedSetRow({
  setNumber,
  existingSet,
  prevSet,
  suggestedWeight,
  targetMinReps,
  targetMaxReps,
  onSave,
  isPending,
}: {
  setNumber: number
  existingSet?: SetData
  prevSet?: PreviousSetData
  suggestedWeight?: number
  targetMinReps: number
  targetMaxReps: number
  onSave: (data: {
    setId?: string
    setNumber: number
    weight: number
    reps: number
  }) => void
  isPending: boolean
}) {
  const [weight, setWeight] = useState(
    existingSet ? String(existingSet.weight) : suggestedWeight ? String(suggestedWeight) : '',
  )
  const [reps, setReps] = useState(existingSet ? String(existingSet.reps) : '')
  const [saved, setSaved] = useState(!!existingSet)

  function handleDone() {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    if (isNaN(w) || isNaN(r)) return

    if (existingSet) {
      if (w === existingSet.weight && r === existingSet.reps) return
    }

    onSave({
      setId: existingSet?.id,
      setNumber,
      weight: w,
      reps: r,
    })
    setSaved(true)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
      handleDone()
    }
  }

  return (
    <div className="grid grid-cols-[24px_1fr_1fr_auto] gap-2 items-center py-2 border-b border-zinc-100 last:border-b-0">
      {/* Set number */}
      <span className="text-xs font-medium text-zinc-400">{setNumber}</span>

      {/* Previous set */}
      <div className="text-sm text-zinc-400">
        {prevSet ? (
          <span>{prevSet.weight}kg × {prevSet.reps}</span>
        ) : (
          <span className="text-zinc-300">-</span>
        )}
      </div>

      {/* Current inputs */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          placeholder="kg"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setSaved(false) }}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className="w-16 bg-white border border-zinc-200 rounded px-2 py-1.5 text-sm text-zinc-900 placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
        <span className="text-zinc-300">×</span>
        <input
          type="number"
          placeholder={`${targetMinReps}-${targetMaxReps}`}
          value={reps}
          onChange={(e) => { setReps(e.target.value); setSaved(false) }}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className="w-14 bg-white border border-zinc-200 rounded px-2 py-1.5 text-sm text-zinc-900 placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      {/* Done button */}
      <button
        onClick={handleDone}
        disabled={isPending || !weight || !reps || saved}
        className={`w-12 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          saved
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40'
        }`}
      >
        {saved ? '✓' : '완료'}
      </button>
    </div>
  )
}
