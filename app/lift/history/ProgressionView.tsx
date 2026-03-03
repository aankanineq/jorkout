'use client'

import { useState } from 'react'

const MODULE_LABEL: Record<string, string> = {
  SQ: '스쿼트',
  HN: '힙힌지',
  PU: '수평푸시',
  VU: '수직푸시',
  PL: '수직풀',
  RL: '수평풀',
}

type SetInfo = { weight: number; reps: number; rpe: number | null }
type LogEntry = {
  date: string
  topWeight: number
  totalVolume: number
  avgRpe: number | null
  sets: SetInfo[]
  suggestIncrease: boolean
}
type ExerciseData = {
  id: string
  name: string
  moduleCode: string
  logs: LogEntry[]
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

export default function ProgressionView({ exercises }: { exercises: ExerciseData[] }) {
  const [selected, setSelected] = useState(exercises[0]?.id ?? '')

  const exercise = exercises.find((e) => e.id === selected)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">프로그레션</h1>

      {/* Exercise selector */}
      <div className="flex gap-2 flex-wrap">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelected(ex.id)}
            className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
              selected === ex.id
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {ex.name}
          </button>
        ))}
      </div>

      {exercise && exercise.logs.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            {MODULE_LABEL[exercise.moduleCode]} · {exercise.logs.length}회 기록
          </p>

          {/* Simple bar chart of top weight */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 mb-2">최고 중량 추이</p>
            {(() => {
              const maxWeight = Math.max(...exercise.logs.map((l) => l.topWeight))
              return exercise.logs.map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 w-14 shrink-0">{formatDate(log.date)}</span>
                  <div className="flex-1 h-6 bg-zinc-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded flex items-center justify-end pr-2"
                      style={{ width: `${maxWeight > 0 ? (log.topWeight / maxWeight) * 100 : 0}%` }}
                    >
                      <span className="text-xs text-white font-medium">{log.topWeight}kg</span>
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>

          {/* Session details */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 mb-2">세션별 상세</p>
            {[...exercise.logs].reverse().map((log, i) => (
              <div key={i} className="rounded-lg bg-zinc-50 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-700">{formatDate(log.date)}</span>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    {log.avgRpe && <span>RPE {log.avgRpe}</span>}
                    <span>볼륨 {log.totalVolume.toLocaleString()}kg</span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {log.sets.map((s, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                      {s.weight}×{s.reps}
                      {s.rpe && <span className="text-zinc-400"> @{s.rpe}</span>}
                    </span>
                  ))}
                </div>
                {log.suggestIncrease && (
                  <p className="mt-2 text-xs text-emerald-600 font-medium">
                    모든 세트 8렙+ 달성 — 다음 세션에서 무게 증가를 고려하세요
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : exercise ? (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-6 py-12 text-center">
          <p className="text-zinc-400">기록이 없습니다</p>
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-6 py-12 text-center">
          <p className="text-zinc-400">메인 리프트를 등록하세요</p>
        </div>
      )}
    </div>
  )
}
