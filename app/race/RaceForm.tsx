'use client'

import { useState } from 'react'
import { createRace } from '@/app/actions/race'

export function RaceForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [distance, setDistance] = useState('')
  const [goalTime, setGoalTime] = useState('')
  const [weeklyTarget, setWeeklyTarget] = useState('')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-white/5 rounded-lg p-3 text-center text-white/40 text-sm"
      >
        + 대회 등록
      </button>
    )
  }

  return (
    <div className="bg-white/5 rounded-xl p-4 space-y-3">
      <h3 className="font-bold text-sm">대회 등록</h3>
      <input value={name} onChange={(e) => setName(e.target.value)}
        placeholder="대회명" className="bg-white/10 rounded-lg px-3 py-2 w-full text-sm" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
        className="bg-white/10 rounded-lg px-3 py-2 w-full text-sm" />
      <div className="flex gap-2">
        <input type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)}
          placeholder="거리(km)" className="bg-white/10 rounded-lg px-3 py-2 flex-1 text-sm" />
        <input value={goalTime} onChange={(e) => setGoalTime(e.target.value)}
          placeholder="목표시간 (1:59:59)" className="bg-white/10 rounded-lg px-3 py-2 flex-1 text-sm" />
      </div>
      <input type="number" step="1" value={weeklyTarget} onChange={(e) => setWeeklyTarget(e.target.value)}
        placeholder="주간 목표 km (선택)" className="bg-white/10 rounded-lg px-3 py-2 w-full text-sm" />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 bg-white/10 rounded-lg py-2 text-sm">취소</button>
        <form action={async () => {
          if (!name || !date || !distance) return
          await createRace({
            name,
            date,
            distanceKm: Number(distance),
            goalTime: goalTime || undefined,
            weeklyTargetKm: weeklyTarget ? Number(weeklyTarget) : undefined,
          })
        }} className="flex-1">
          <button className="w-full bg-white text-black rounded-lg py-2 text-sm font-bold">등록</button>
        </form>
      </div>
    </div>
  )
}
