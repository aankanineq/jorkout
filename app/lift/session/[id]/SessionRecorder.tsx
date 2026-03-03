'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addExerciseLog,
  saveSet,
  deleteSet,
  deleteExerciseLog,
} from '@/app/actions/liftSession'

const MODULE_LABEL: Record<string, string> = {
  SQ: '스쿼트',
  HN: '힙힌지',
  PU: '수평푸시',
  VU: '수직푸시',
  PL: '수직풀',
  RL: '수평풀',
}

type SetData = {
  id: string
  setNumber: number
  weight: number
  reps: number
  rpe: number | null
  isWarmup: boolean
}

type ExerciseLogData = {
  id: string
  exerciseId: string
  exerciseName: string
  moduleCode: string
  isMain: boolean
  order: number
  sets: SetData[]
}

type SessionData = {
  id: string
  date: string
  splitLabel: string
  modules: string[]
  exerciseLogs: ExerciseLogData[]
}

type ExerciseOption = {
  id: string
  name: string
  moduleCode: string
  isMain: boolean
}

type PreviousSetData = { weight: number; reps: number; rpe: number | null }

export default function SessionRecorder({
  session,
  exercises,
  previousData = {},
  runLoadWarning,
}: {
  session: SessionData
  exercises: ExerciseOption[]
  previousData?: Record<string, PreviousSetData[]>
  runLoadWarning?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedModule, setSelectedModule] = useState(session.modules[0] || '')

  const dateStr = new Date(session.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const usedExerciseIds = new Set(session.exerciseLogs.map((l) => l.exerciseId))
  const filteredExercises = exercises.filter(
    (e) => e.moduleCode === selectedModule && !usedExerciseIds.has(e.id),
  )

  function handleAddExercise(exerciseId: string) {
    const exercise = exercises.find((e) => e.id === exerciseId)
    if (!exercise) return
    startTransition(async () => {
      await addExerciseLog(session.id, exerciseId, exercise.moduleCode)
      router.refresh()
    })
  }

  function handleDeleteLog(logId: string) {
    startTransition(async () => {
      await deleteExerciseLog(logId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">세션 기록</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {dateStr} · Split {session.splitLabel}
          </p>
        </div>
        <button
          onClick={() => router.push('/lift')}
          className="text-sm px-4 py-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
        >
          완료
        </button>
      </div>

      {/* Running load warning */}
      {runLoadWarning && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
          <p className="text-sm text-orange-700">{runLoadWarning}</p>
        </div>
      )}

      {/* Add exercise */}
      <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
        <h3 className="text-sm font-medium text-zinc-500">운동 추가</h3>
        <div className="flex gap-2 flex-wrap">
          {session.modules.map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${selectedModule === mod
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
            >
              {MODULE_LABEL[mod]}
            </button>
          ))}
        </div>
        {filteredExercises.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {filteredExercises.map((ex) => (
              <button
                key={ex.id}
                disabled={isPending}
                onClick={() => handleAddExercise(ex.id)}
                className="text-sm px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {ex.name}
                {ex.isMain && (
                  <span className="ml-1 text-xs text-amber-500">★</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">
            {selectedModule
              ? '추가할 운동이 없습니다'
              : '모듈을 선택하세요'}
          </p>
        )}
      </div>

      {/* Exercise logs */}
      {session.exerciseLogs.map((log) => (
        <ExerciseCard
          key={log.id}
          log={log}
          sessionId={session.id}
          onDelete={() => handleDeleteLog(log.id)}
          previousSets={previousData[log.exerciseId]}
        />
      ))}

      {session.exerciseLogs.length === 0 && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-6 py-12 text-center">
          <p className="text-zinc-400">운동을 추가하세요</p>
        </div>
      )}
    </div>
  )
}

function ExerciseCard({
  log,
  sessionId,
  onDelete,
  previousSets,
}: {
  log: ExerciseLogData
  sessionId: string
  onDelete: () => void
  previousSets?: PreviousSetData[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSaveSet(data: {
    setId?: string
    setNumber: number
    weight: number
    reps: number
    rpe?: number | null
    isWarmup?: boolean
  }) {
    startTransition(async () => {
      await saveSet(log.id, data)
      router.refresh()
    })
  }

  function handleDeleteSet(setId: string) {
    startTransition(async () => {
      await deleteSet(setId)
      router.refresh()
    })
  }

  const nextSetNumber = log.sets.length > 0
    ? Math.max(...log.sets.map((s) => s.setNumber)) + 1
    : 1

  return (
    <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">{log.exerciseName}</h3>
          {log.isMain && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              메인
            </span>
          )}
          <span className="text-xs text-zinc-400">
            {MODULE_LABEL[log.moduleCode]}
          </span>
        </div>
        <button
          onClick={onDelete}
          disabled={isPending}
          className="text-xs text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          삭제
        </button>
      </div>

      {/* Previous session reference */}
      {previousSets && previousSets.length > 0 && log.sets.length === 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-xs text-amber-600 mb-1">지난 세션</p>
          <div className="flex gap-1.5 flex-wrap">
            {previousSets.map((s, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                {s.weight}×{s.reps}
                {s.rpe && <span className="text-amber-500"> @{s.rpe}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sets table */}
      {log.sets.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-400 border-b border-zinc-200">
                <th className="text-left py-1.5 w-8">#</th>
                <th className="text-left py-1.5">kg</th>
                <th className="text-left py-1.5">reps</th>
                <th className="text-left py-1.5">RPE</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {log.sets.map((set) => (
                <SetRow
                  key={set.id}
                  set={set}
                  onSave={handleSaveSet}
                  onDelete={() => handleDeleteSet(set.id)}
                  isPending={isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add set */}
      <NewSetRow
        setNumber={nextSetNumber}
        onSave={handleSaveSet}
        isPending={isPending}
      />
    </div>
  )
}

function SetRow({
  set,
  onSave,
  onDelete,
  isPending,
}: {
  set: SetData
  onSave: (data: {
    setId: string
    setNumber: number
    weight: number
    reps: number
    rpe?: number | null
  }) => void
  onDelete: () => void
  isPending: boolean
}) {
  const [weight, setWeight] = useState(String(set.weight))
  const [reps, setReps] = useState(String(set.reps))
  const [rpe, setRpe] = useState(set.rpe != null ? String(set.rpe) : '')

  function handleBlur() {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    if (isNaN(w) || isNaN(r)) return
    if (w === set.weight && r === set.reps && (rpe === '' ? null : parseFloat(rpe)) === set.rpe) return
    onSave({
      setId: set.id,
      setNumber: set.setNumber,
      weight: w,
      reps: r,
      rpe: rpe ? parseFloat(rpe) : null,
    })
  }

  return (
    <tr className="border-b border-zinc-200">
      <td className="py-1.5 text-zinc-400">{set.setNumber}</td>
      <td className="py-1.5">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={handleBlur}
          className="w-16 bg-white border border-zinc-200 rounded px-2 py-1 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </td>
      <td className="py-1.5">
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={handleBlur}
          className="w-14 bg-white border border-zinc-200 rounded px-2 py-1 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </td>
      <td className="py-1.5">
        <input
          type="number"
          step="0.5"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          onBlur={handleBlur}
          placeholder="-"
          className="w-14 bg-white border border-zinc-200 rounded px-2 py-1 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </td>
      <td className="py-1.5 text-right">
        <button
          onClick={onDelete}
          disabled={isPending}
          className="text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          ✕
        </button>
      </td>
    </tr>
  )
}

function NewSetRow({
  setNumber,
  onSave,
  isPending,
}: {
  setNumber: number
  onSave: (data: {
    setNumber: number
    weight: number
    reps: number
    rpe?: number | null
    isWarmup?: boolean
  }) => void
  isPending: boolean
}) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState('')

  function handleAdd() {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    if (isNaN(w) || isNaN(r)) return
    onSave({
      setNumber,
      weight: w,
      reps: r,
      rpe: rpe ? parseFloat(rpe) : null,
    })
    setWeight('')
    setReps('')
    setRpe('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400 w-6">{setNumber}</span>
      <input
        type="number"
        placeholder="kg"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-16 bg-white border border-zinc-200 rounded px-2 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <input
        type="number"
        placeholder="reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-14 bg-white border border-zinc-200 rounded px-2 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <input
        type="number"
        step="0.5"
        placeholder="RPE"
        value={rpe}
        onChange={(e) => setRpe(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-14 bg-white border border-zinc-200 rounded px-2 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        onClick={handleAdd}
        disabled={isPending || !weight || !reps}
        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
      >
        추가
      </button>
    </div>
  )
}
