'use client'

import { useState } from 'react'
import { createBodyLog } from '@/app/actions/bodyLog'

type LogEntry = {
  date: string
  weight: number | null
  bodyFat: number | null
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(iso))
}

export default function BodyTracker({
  todayLog,
  recentLogs,
}: {
  todayLog: { weight: number | null; bodyFat: number | null; notes: string | null } | null
  recentLogs: LogEntry[]
}) {
  const [weight, setWeight] = useState(todayLog?.weight?.toString() ?? '')
  const [bodyFat, setBodyFat] = useState(todayLog?.bodyFat?.toString() ?? '')
  const [notes, setNotes] = useState(todayLog?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!weight && !bodyFat) return
    setSubmitting(true)
    await createBodyLog({
      weight: weight ? parseFloat(weight) : null,
      bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      notes: notes || undefined,
    })
    setSubmitting(false)
  }

  // Simple trend: compare latest to 7 days ago
  const weightLogs = recentLogs.filter((l: any) => l.weight != null)
  const latestWeight = weightLogs[0]?.weight
  const weekAgoWeight = weightLogs.length >= 7 ? weightLogs[6]?.weight : null
  const weightDelta = latestWeight != null && weekAgoWeight != null ? latestWeight - weekAgoWeight : null

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900">바디 트래킹</h1>

      {/* Today's form */}
      <form onSubmit={handleSubmit} className="rounded-xl bg-zinc-50 border border-zinc-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700">오늘 기록</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">체중 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75.0"
              className="w-full rounded-lg bg-white border border-zinc-200 px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">체지방 (%)</label>
            <input
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="15.0"
              className="w-full rounded-lg bg-white border border-zinc-200 px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="메모 (선택)"
          className="w-full rounded-lg bg-white border border-zinc-200 px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          disabled={submitting || (!weight && !bodyFat)}
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '저장 중...' : todayLog ? '오늘 기록 업데이트' : '기록 저장'}
        </button>
      </form>

      {/* Trend */}
      {weightDelta !== null && (
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-center">
          <span className="text-xs text-zinc-400">최근 7일 변화</span>
          <p className={`text-lg font-semibold ${weightDelta > 0 ? 'text-rose-600' : weightDelta < 0 ? 'text-emerald-600' : 'text-zinc-500'}`}>
            {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg
          </p>
        </div>
      )}

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">최근 기록</h2>
          <div className="space-y-1">
            {recentLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2.5">
                <span className="text-sm text-zinc-600">{formatDate(log.date)}</span>
                <div className="flex gap-4 text-sm">
                  {log.weight != null && (
                    <span className="text-zinc-700">{log.weight} kg</span>
                  )}
                  {log.bodyFat != null && (
                    <span className="text-zinc-400">{log.bodyFat}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
