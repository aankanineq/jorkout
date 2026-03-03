'use client'

import { useState } from 'react'
import { createRunSession } from '@/app/actions/runSession'

const RUN_TYPES = [
  { value: 'EASY', label: '이지' },
  { value: 'TEMPO', label: '템포' },
  { value: 'INTERVAL', label: '인터벌' },
  { value: 'LONG', label: '롱런' },
  { value: 'RECOVERY', label: '리커버리' },
  { value: 'FARTLEK', label: '파틀렉' },
] as const

const RUN_TYPE_COLOR: Record<string, string> = {
  EASY: 'bg-sky-600',
  TEMPO: 'bg-orange-600',
  INTERVAL: 'bg-rose-600',
  LONG: 'bg-violet-600',
  RECOVERY: 'bg-teal-600',
  FARTLEK: 'bg-pink-600',
}

export default function RunLogPage() {
  const [distanceKm, setDistanceKm] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [runType, setRunType] = useState('EASY')
  const [rpe, setRpe] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const dist = parseFloat(distanceKm) || 0
  const durationSec = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0)
  const pace = dist > 0 && durationSec > 0 ? Math.round(durationSec / dist) : null

  function formatPace(paceSeconds: number): string {
    const m = Math.floor(paceSeconds / 60)
    const s = paceSeconds % 60
    return `${m}'${s.toString().padStart(2, '0')}"/km`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (dist <= 0 || durationSec <= 0) return
    setSubmitting(true)
    await createRunSession({
      distanceKm: dist,
      durationSec,
      runType,
      rpe: rpe ? parseFloat(rpe) : null,
      notes: notes || undefined,
    })
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-8">
        <h1 className="text-2xl font-bold text-zinc-900">러닝 기록</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 거리 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600">거리 (km)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="5.00"
              required
              className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 시간 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600">시간</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="분"
                required
                className="flex-1 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-zinc-400">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="초"
                required
                className="flex-1 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 페이스 미리보기 */}
          {pace && (
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-center">
              <span className="text-xs text-zinc-400">평균 페이스</span>
              <p className="text-lg font-semibold text-emerald-600">{formatPace(pace)}</p>
            </div>
          )}

          {/* RunType */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600">타입</label>
            <div className="flex flex-wrap gap-2">
              {RUN_TYPES.map((t: any) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setRunType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${runType === t.value
                      ? `${RUN_TYPE_COLOR[t.value]} text-white`
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* RPE */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600">
              RPE <span className="text-zinc-400 font-normal">(선택)</span>
            </label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.5"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              placeholder="1-10"
              className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600">
              메모 <span className="text-zinc-400 font-normal">(선택)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="오늘 러닝은 어땠나요?"
              className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* 제출 */}
          <button
            type="submit"
            disabled={submitting || dist <= 0 || durationSec <= 0}
            className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '저장 중...' : '기록 저장'}
          </button>
        </form>
      </div>
    </div>
  )
}
