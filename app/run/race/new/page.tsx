'use client'

import { useState } from 'react'
import { createRace } from '@/app/actions/race'

export default function NewRacePage() {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [distance, setDistance] = useState('')
  const [goalHours, setGoalHours] = useState('')
  const [goalMinutes, setGoalMinutes] = useState('')
  const [goalSeconds, setGoalSeconds] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const goalTime =
    goalHours || goalMinutes || goalSeconds
      ? (parseInt(goalHours) || 0) * 3600 + (parseInt(goalMinutes) || 0) * 60 + (parseInt(goalSeconds) || 0)
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !date || !distance) return
    setSubmitting(true)
    await createRace({
      name: name.trim(),
      date,
      distance: parseFloat(distance),
      goalTime,
    })
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-8">
        <h1 className="text-2xl font-bold text-zinc-900">대회 등록</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600">대회명</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2026 춘천 하프마라톤"
              required
              className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600">거리 (km)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="21.1"
              required
              className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600">
              목표 시간 <span className="text-zinc-400 font-normal">(선택)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={goalHours}
                onChange={(e) => setGoalHours(e.target.value)}
                placeholder="시"
                className="flex-1 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-zinc-400">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={goalMinutes}
                onChange={(e) => setGoalMinutes(e.target.value)}
                placeholder="분"
                className="flex-1 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-zinc-400">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={goalSeconds}
                onChange={(e) => setGoalSeconds(e.target.value)}
                placeholder="초"
                className="flex-1 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim() || !date || !distance}
            className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '등록 중...' : '대회 등록'}
          </button>
        </form>
      </div>
    </div>
  )
}
