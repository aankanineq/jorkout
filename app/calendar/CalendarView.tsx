'use client'

import { useState } from 'react'

const MODULE_LABEL: Record<string, string> = {
  SQ: '스쿼트', HN: '힙힌지', PU: '수평푸시',
  VU: '수직푸시', PL: '수직풀', RL: '수평풀',
}

const RUN_TYPE_LABEL: Record<string, string> = {
  EASY: '이지', LONG: '롱런', TEMPO: '템포',
  INTERVAL: '인터벌', RECOVERY: '리커버리',
  RACE: '레이스', FARTLEK: '파틀렉',
}

type ActivityData = {
  id: string
  date: string
  type: 'LIFT' | 'RUN'
  lift: { splitLabel: string; modules: string[] } | null
  run: { distanceKm: number; avgPace: number; runType: string } | null
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

function formatPace(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}'${s.toString().padStart(2, '0')}"`
}

export default function CalendarView({ activities }: { activities: ActivityData[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday-based offset (0=Mon, 6=Sun)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const daysInMonth = lastDay.getDate()
  const totalCells = startOffset + daysInMonth
  const rows = Math.ceil(totalCells / 7)

  // Group activities by date string (YYYY-MM-DD)
  const activityMap = new Map<string, ActivityData[]>()
  activities.forEach((a) => {
    const key = new Date(a.date).toISOString().slice(0, 10)
    const list = activityMap.get(key) || []
    list.push(a)
    activityMap.set(key, list)
  })

  const todayStr = new Date().toISOString().slice(0, 10)

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">달력</h1>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="text-zinc-400 hover:text-zinc-600 transition-colors text-lg">←</button>
          <span className="text-sm font-semibold text-zinc-700">
            {year}년 {month + 1}월
          </span>
          <button onClick={nextMonth} className="text-zinc-400 hover:text-zinc-600 transition-colors text-lg">→</button>
        </div>
      </div>

      {/* Grid */}
      <div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-xs font-medium text-zinc-400 py-2">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: rows * 7 }, (_, i) => {
            const dayNum = i - startOffset + 1
            const isValidDay = dayNum >= 1 && dayNum <= daysInMonth

            if (!isValidDay) {
              return <div key={i} className="min-h-20 border-t border-zinc-100" />
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            const dayActivities = activityMap.get(dateStr) || []
            const isToday = dateStr === todayStr

            return (
              <div
                key={i}
                className={`min-h-20 border-t border-zinc-100 p-1 ${isToday ? 'bg-indigo-50' : ''}`}
              >
                <div className={`text-xs font-medium mb-1 ${isToday ? 'text-indigo-600' : 'text-zinc-500'}`}>
                  {dayNum}
                </div>
                <div className="space-y-0.5">
                  {dayActivities.map((a) => (
                    <div
                      key={a.id}
                      className={`text-xs px-1 py-0.5 rounded truncate ${
                        a.type === 'LIFT'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {a.type === 'LIFT' && a.lift
                        ? `${a.lift.modules.map((m) => MODULE_LABEL[m]?.slice(0, 2)).join('/')}`
                        : a.run
                          ? `${a.run.distanceKm.toFixed(1)}km ${RUN_TYPE_LABEL[a.run.runType]}`
                          : ''}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
