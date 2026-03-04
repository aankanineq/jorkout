'use client'

import { useState, useTransition } from 'react'
import { deleteActivity } from '@/app/actions/activity'

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']
const ACTIVITY_LABELS: Record<string, string> = {
  LIFT: 'LIFT', RUN: 'RUN', SPORT: 'SPORT', REST: 'REST',
}

type Activity = {
  id: string
  date: Date | string
  type: string
  liftSession?: { liftType: string, completed: boolean, duration: number | null, exerciseLogs: { sets: object[] }[] } | null
  runSession?: { runType: string, distanceKm: number, avgPace: number } | null
  sportSession?: { sportType: string, durationMin: number | null, rpe: number | null } | null
}

type Props = {
  year: number
  month: number // 0-indexed
  byDay: Record<number, Activity[]>
  today: number
  isCurrentMonth: boolean
  liftNames: Record<string, string>
}

export function CalendarView({ year, month, byDay, today, isCurrentMonth, liftNames }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Sunday = 0
  const startOffset = firstDay.getDay()

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedActs = selectedDay ? byDay[selectedDay] || [] : []

  return (
    <div className="space-y-3">
      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground font-medium">
        {DAY_HEADERS.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-card aspect-square" />
          }

          const acts = byDay[day] || []
          const isToday = isCurrentMonth && day === today
          const isSelected = day === selectedDay

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`
                bg-card aspect-square flex flex-col items-center justify-center gap-0.5
                hover:bg-muted/50 transition-colors relative
                ${isSelected ? 'bg-muted' : ''}
              `}
            >
              <span className={`
                text-xs tabular-nums leading-none
                ${isToday ? 'font-bold text-foreground' : 'text-muted-foreground'}
              `}>
                {day}
              </span>

              {/* Activity dots */}
              {acts.length > 0 && (
                <div className="flex gap-0.5">
                  {acts.map((act) => (
                    <div
                      key={act.id}
                      className={`w-1 h-1 rounded-full ${
                        act.type === 'LIFT' ? (act.liftSession && !act.liftSession.completed ? 'bg-yellow-500' : 'bg-foreground') :
                        act.type === 'RUN' ? 'bg-blue-500' :
                        act.type === 'SPORT' ? 'bg-amber-500' :
                        'bg-muted-foreground/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay !== null && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="text-xs text-muted-foreground font-medium mb-2">
            {month + 1}월 {selectedDay}일
          </div>

          {selectedActs.length === 0 ? (
            <div className="text-sm text-muted-foreground">기록 없음</div>
          ) : (
            selectedActs.map(act => (
              <div key={act.id} className="flex items-start gap-3 py-1">
                <span className="text-xs font-bold tracking-wide text-muted-foreground w-10 shrink-0 pt-0.5">
                  {ACTIVITY_LABELS[act.type]}
                </span>
                <div className="flex-1 min-w-0">
                  {act.liftSession && (
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {liftNames[act.liftSession.liftType] || act.liftSession.liftType} Day
                        {!act.liftSession.completed && (
                          <span className="text-[10px] font-medium text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">진행중</span>
                        )}
                      </div>
                      {act.liftSession.duration && (
                        <div className="text-xs text-muted-foreground">{act.liftSession.duration}분</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {act.liftSession.exerciseLogs.length}운동 · {act.liftSession.exerciseLogs.reduce((sum, l) => sum + l.sets.length, 0)}세트
                      </div>
                    </div>
                  )}
                  {act.runSession && (
                    <div>
                      <div className="font-medium text-sm">{act.runSession.runType} Run</div>
                      <div className="text-xs text-muted-foreground">
                        {act.runSession.distanceKm}km · {Math.floor(act.runSession.avgPace / 60)}:{(act.runSession.avgPace % 60).toString().padStart(2, '0')}/km
                      </div>
                    </div>
                  )}
                  {act.sportSession && (
                    <div>
                      <div className="font-medium text-sm">{act.sportSession.sportType}</div>
                      <div className="text-xs text-muted-foreground">
                        {act.sportSession.durationMin}분{act.sportSession.rpe ? ` · RPE ${act.sportSession.rpe}` : ''}
                      </div>
                    </div>
                  )}
                  {act.type === 'REST' && (
                    <div className="font-medium text-sm">Rest</div>
                  )}
                </div>
                <button
                  disabled={pending}
                  onClick={() => {
                    if (!confirm('이 기록을 삭제할까요?')) return
                    startTransition(() => deleteActivity(act.id))
                  }}
                  className="text-muted-foreground/40 hover:text-red-500 transition-colors text-xs shrink-0 pt-0.5 disabled:opacity-30"
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-foreground" /> Lift</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Run</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Sport</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" /> Rest</span>
      </div>
    </div>
  )
}
