'use client'

import { useState, useTransition } from 'react'
import { deleteActivity, logRest } from '@/app/actions/activity'
import { createRunSession, updateRunSession } from '@/app/actions/runSession'
import { createSportSession, updateSportSession } from '@/app/actions/sportSession'
import { createPastLiftSession } from '@/app/actions/liftSession'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']
const ACTIVITY_LABELS: Record<string, string> = {
  LIFT: 'LIFT', RUN: 'RUN', SPORT: 'SPORT', REST: 'REST',
}
const RUN_TYPES = ['EASY', 'QUALITY', 'LONG'] as const
const SPORT_TYPES = [
  { value: 'TENNIS', label: '테니스' },
  { value: 'SOCCER', label: '축구' },
  { value: 'OTHER', label: '기타' },
]

type Activity = {
  id: string
  date: Date | string
  type: string
  liftSession?: { id: string, liftType: string, completed: boolean, duration: number | null, exerciseLogs: { sets: object[] }[] } | null
  runSession?: { id: string, runType: string, distanceKm: number, durationSec: number, avgPace: number } | null
  sportSession?: { id: string, sportType: string, durationMin: number | null, rpe: number | null } | null
}

type Props = {
  year: number
  month: number // 0-indexed
  byDay: Record<number, Activity[]>
  today: number
  isCurrentMonth: boolean
  liftNames: Record<string, string>
}

const LIFT_TYPES = [
  { value: 'BENCH', label: 'Bench' },
  { value: 'SQUAT', label: 'Squat' },
  { value: 'OHP', label: 'OHP' },
  { value: 'DEAD', label: 'Dead' },
]

export function CalendarView({ year, month, byDay, today, isCurrentMonth, liftNames }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingType, setAddingType] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

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
      <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground font-medium mb-1">
        {DAY_HEADERS.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />
          }

          const acts = byDay[day] || []
          const isToday = isCurrentMonth && day === today
          const isSelected = day === selectedDay
          const hasActs = acts.length > 0

          // 가장 우선 활동의 색상으로 배경
          const primaryType = acts[0]?.type?.toLowerCase() as 'lift' | 'run' | 'sport' | 'rest' | undefined

          return (
            <button
              key={day}
              onClick={() => { setSelectedDay(isSelected ? null : day); setAddingType(null); setEditingId(null) }}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center gap-1
                transition-all relative bg-card border border-border/50
                ${isSelected ? 'ring-2 ring-foreground/30 scale-105' : ''}
                ${!hasActs ? 'hover:bg-muted/50' : 'hover:opacity-80'}
              `}
            >
              <span className={`
                text-[11px] tabular-nums leading-none
                ${isToday ? 'font-black' : hasActs ? 'font-semibold' : 'text-muted-foreground'}
              `}>
                {day}
              </span>

              {/* Activity blocks */}
              {hasActs && (
                <div className="flex gap-0.5">
                  {acts.map((act) => (
                    <div
                      key={act.id}
                      className="w-1.5 h-1.5 rounded-sm"
                      style={{ background: `var(--color-${act.type.toLowerCase()})` }}
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
        <div className="rounded-2xl shadow-sm p-4 space-y-2 bg-card border border-border">
          <div className="text-xs text-muted-foreground font-medium mb-2">
            {month + 1}월 {selectedDay}일
          </div>

          {selectedActs.length === 0 ? (
            <div className="text-sm text-muted-foreground">기록 없음</div>
          ) : (
            selectedActs.map(act => {
              const isEditing = editingId === act.id
              const actColor = act.type.toLowerCase()

              return (
                <div key={act.id} className="py-1">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold tracking-wide w-10 shrink-0 pt-0.5"
                      style={{ color: `var(--color-${actColor})` }}>
                      {ACTIVITY_LABELS[act.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      {act.liftSession && (
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            <Link href={`/session/${act.liftSession.id}`} className="hover:underline">
                              {liftNames[act.liftSession.liftType] || act.liftSession.liftType} Day
                            </Link>
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
                      {act.runSession && !isEditing && (
                        <div>
                          <div className="font-medium text-sm">{act.runSession.runType} Run</div>
                          <div className="text-xs text-muted-foreground">
                            {act.runSession.distanceKm}km · {Math.floor(act.runSession.avgPace / 60)}:{(act.runSession.avgPace % 60).toString().padStart(2, '0')}/km
                          </div>
                        </div>
                      )}
                      {act.sportSession && !isEditing && (
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
                    <div className="flex gap-2 shrink-0 pt-0.5">
                      {act.liftSession && (
                        <Link
                          href={`/session/${act.liftSession.id}`}
                          className="text-muted-foreground/40 hover:text-foreground transition-colors text-xs"
                        >
                          수정
                        </Link>
                      )}
                      {(act.runSession || act.sportSession) && (
                        <button
                          disabled={pending}
                          onClick={() => setEditingId(isEditing ? null : act.id)}
                          className="text-muted-foreground/40 hover:text-foreground transition-colors text-xs disabled:opacity-30"
                        >
                          {isEditing ? '취소' : '수정'}
                        </button>
                      )}
                      <button
                        disabled={pending}
                        onClick={() => {
                          if (!confirm('이 기록을 삭제할까요?')) return
                          startTransition(() => deleteActivity(act.id))
                        }}
                        className="text-muted-foreground/40 hover:text-red-500 transition-colors text-xs disabled:opacity-30"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* 인라인 수정 폼 */}
                  {isEditing && act.runSession && (
                    <RunEditForm
                      session={act.runSession}
                      pending={pending}
                      onSave={(data) => {
                        startTransition(async () => {
                          await updateRunSession(act.runSession!.id, data)
                          setEditingId(null)
                        })
                      }}
                    />
                  )}
                  {isEditing && act.sportSession && (
                    <SportEditForm
                      session={act.sportSession}
                      pending={pending}
                      onSave={(data) => {
                        startTransition(async () => {
                          await updateSportSession(act.sportSession!.id, data)
                          setEditingId(null)
                        })
                      }}
                    />
                  )}
                </div>
              )
            })
          )}

          {/* 기록 추가 */}
          {!addingType ? (
            <button
              onClick={() => setAddingType('SELECT')}
              className="w-full mt-2 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              + 기록 추가
            </button>
          ) : addingType === 'SELECT' ? (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-4 gap-1.5">
                {['LIFT', 'RUN', 'SPORT', 'REST'].map((t) => (
                  <button
                    key={t}
                    disabled={pending}
                    onClick={() => {
                      if (t === 'REST') {
                        const d = new Date(Date.UTC(year, month, selectedDay!))
                        startTransition(async () => {
                          await logRest(d)
                          setAddingType(null)
                        })
                      } else {
                        setAddingType(t)
                      }
                    }}
                    className="py-1.5 rounded text-xs font-medium bg-muted border border-border/50 hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={() => setAddingType(null)} className="text-xs text-muted-foreground/60">취소</button>
            </div>
          ) : addingType === 'LIFT' ? (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-4 gap-1.5">
                {LIFT_TYPES.map((lt) => (
                  <button
                    key={lt.value}
                    disabled={pending}
                    onClick={() => {
                      const d = new Date(Date.UTC(year, month, selectedDay!))
                      startTransition(async () => {
                        const sessionId = await createPastLiftSession(lt.value as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD', d)
                        setAddingType(null)
                        router.push(`/session/${sessionId}`)
                      })
                    }}
                    className="py-1.5 rounded text-xs font-medium bg-muted border border-border/50 hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
                  >
                    {lt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setAddingType('SELECT')} className="text-xs text-muted-foreground/60">← 뒤로</button>
            </div>
          ) : addingType === 'RUN' ? (
            <RunAddForm
              pending={pending}
              onSave={(data) => {
                const d = new Date(Date.UTC(year, month, selectedDay!))
                startTransition(async () => {
                  await createRunSession({ ...data, date: d })
                  setAddingType(null)
                })
              }}
              onCancel={() => setAddingType('SELECT')}
            />
          ) : addingType === 'SPORT' ? (
            <SportAddForm
              pending={pending}
              onSave={(data) => {
                const d = new Date(Date.UTC(year, month, selectedDay!))
                startTransition(async () => {
                  await createSportSession({ ...data, date: d })
                  setAddingType(null)
                })
              }}
              onCancel={() => setAddingType('SELECT')}
            />
          ) : null}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-lift)' }} /> Lift</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-run)' }} /> Run</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-sport)' }} /> Sport</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-rest)' }} /> Rest</span>
      </div>
    </div>
  )
}

function RunEditForm({
  session,
  pending,
  onSave,
}: {
  session: { runType: string; distanceKm: number; durationSec: number; avgPace: number }
  pending: boolean
  onSave: (data: { distanceKm: number; durationSec: number; runType: string }) => void
}) {
  const [runType, setRunType] = useState(session.runType)
  const [distance, setDistance] = useState(String(session.distanceKm))
  const [minutes, setMinutes] = useState(String(Math.floor(session.durationSec / 60)))
  const [seconds, setSeconds] = useState(String(session.durationSec % 60))

  const distNum = Number(distance) || 0
  const totalSec = (Number(minutes) || 0) * 60 + (Number(seconds) || 0)
  const pace = distNum > 0 && totalSec > 0 ? Math.round(totalSec / distNum) : 0

  return (
    <div className="mt-2 ml-13 space-y-2 bg-muted/50 rounded-lg p-3">
      {/* 타입 */}
      <div className="flex gap-1">
        {RUN_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setRunType(t)}
            className={`flex-1 py-1 rounded text-xs font-medium ${runType === t ? 'bg-foreground text-background' : 'bg-card border border-border/50'
              }`}
          >
            {t}
          </button>
        ))}
      </div>
      {/* 거리 & 시간 */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          className="bg-card border border-border/50 rounded px-2 py-1 text-sm w-16 text-center"
        />
        <span className="text-xs text-muted-foreground">km</span>
        <input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="bg-card border border-border/50 rounded px-2 py-1 text-sm w-12 text-center"
        />
        <span className="text-xs">:</span>
        <input
          type="number"
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          className="bg-card border border-border/50 rounded px-2 py-1 text-sm w-12 text-center"
        />
        {pace > 0 && (
          <span className="text-xs text-muted-foreground">
            {Math.floor(pace / 60)}:{(pace % 60).toString().padStart(2, '0')}/km
          </span>
        )}
      </div>
      <button
        disabled={pending || distNum <= 0 || totalSec <= 0}
        onClick={() => onSave({ distanceKm: distNum, durationSec: totalSec, runType })}
        className="w-full bg-foreground text-background text-xs font-bold py-1.5 rounded-lg disabled:opacity-30"
      >
        저장
      </button>
    </div>
  )
}

function SportEditForm({
  session,
  pending,
  onSave,
}: {
  session: { sportType: string; durationMin: number | null; rpe: number | null }
  pending: boolean
  onSave: (data: { sportType: string; durationMin: number; rpe?: number | null }) => void
}) {
  const [sportType, setSportType] = useState(session.sportType)
  const [duration, setDuration] = useState(String(session.durationMin ?? ''))
  const [rpe, setRpe] = useState<number | null>(session.rpe)

  return (
    <div className="mt-2 ml-13 space-y-2 bg-muted/50 rounded-lg p-3">
      {/* 종목 */}
      <div className="flex gap-1">
        {SPORT_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setSportType(t.value)}
            className={`flex-1 py-1 rounded text-xs font-medium ${sportType === t.value ? 'bg-foreground text-background' : 'bg-card border border-border/50'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* 시간 */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="bg-card border border-border/50 rounded px-2 py-1 text-sm w-16 text-center"
        />
        <span className="text-xs text-muted-foreground">분</span>
      </div>
      {/* RPE */}
      <div className="flex gap-1">
        {[3, 4, 5, 6, 7, 8, 9].map((v) => (
          <button
            key={v}
            onClick={() => setRpe(rpe === v ? null : v)}
            className={`w-7 h-7 rounded-full text-xs ${rpe === v ? 'bg-foreground text-background' : 'bg-card border border-border/50'
              }`}
          >
            {v}
          </button>
        ))}
      </div>
      <button
        disabled={pending || !duration}
        onClick={() => onSave({ sportType, durationMin: Number(duration), rpe })}
        className="w-full bg-foreground text-background text-xs font-bold py-1.5 rounded-lg disabled:opacity-30"
      >
        저장
      </button>
    </div>
  )
}

function RunAddForm({
  pending,
  onSave,
  onCancel,
}: {
  pending: boolean
  onSave: (data: { distanceKm: number; durationSec: number; runType: string }) => void
  onCancel: () => void
}) {
  const [runType, setRunType] = useState<string>('EASY')
  const [distance, setDistance] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')

  const distNum = Number(distance) || 0
  const totalSec = (Number(minutes) || 0) * 60 + (Number(seconds) || 0)
  const pace = distNum > 0 && totalSec > 0 ? Math.round(totalSec / distNum) : 0

  return (
    <div className="mt-2 space-y-2 bg-muted/50 rounded-lg p-3">
      <div className="flex gap-1">
        {RUN_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setRunType(t)}
            className={`flex-1 py-1 rounded text-xs font-medium ${runType === t ? 'bg-foreground text-background' : 'bg-card border border-border/50'
              }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          placeholder="km"
          className="bg-card border border-border/50 rounded px-2 py-1 text-sm w-16 text-center"
        />
        <span className="text-xs text-muted-foreground">km</span>
        <input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="분"
          className="bg-card border border-border/50 rounded px-2 py-1 text-sm w-12 text-center"
        />
        <span className="text-xs">:</span>
        <input
          type="number"
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          placeholder="초"
          className="bg-card border border-border/50 rounded px-2 py-1 text-sm w-12 text-center"
        />
        {pace > 0 && (
          <span className="text-xs text-muted-foreground">
            {Math.floor(pace / 60)}:{(pace % 60).toString().padStart(2, '0')}/km
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="text-xs text-muted-foreground/60">← 뒤로</button>
        <button
          disabled={pending || distNum <= 0 || totalSec <= 0}
          onClick={() => onSave({ distanceKm: distNum, durationSec: totalSec, runType })}
          className="flex-1 bg-foreground text-background text-xs font-bold py-1.5 rounded-lg disabled:opacity-30"
        >
          저장
        </button>
      </div>
    </div>
  )
}

function SportAddForm({
  pending,
  onSave,
  onCancel,
}: {
  pending: boolean
  onSave: (data: { sportType: string; durationMin: number; rpe?: number }) => void
  onCancel: () => void
}) {
  const [sportType, setSportType] = useState('TENNIS')
  const [duration, setDuration] = useState('')
  const [rpe, setRpe] = useState<number | null>(null)

  return (
    <div className="mt-2 space-y-2 bg-muted/50 rounded-lg p-3">
      <div className="flex gap-1">
        {SPORT_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setSportType(t.value)}
            className={`flex-1 py-1 rounded text-xs font-medium ${sportType === t.value ? 'bg-foreground text-background' : 'bg-card border border-border/50'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="분"
          className="bg-card border border-border/50 rounded px-2 py-1 text-sm w-16 text-center"
        />
        <span className="text-xs text-muted-foreground">분</span>
      </div>
      <div className="flex gap-1">
        {[3, 4, 5, 6, 7, 8, 9].map((v) => (
          <button
            key={v}
            onClick={() => setRpe(rpe === v ? null : v)}
            className={`w-7 h-7 rounded-full text-xs ${rpe === v ? 'bg-foreground text-background' : 'bg-card border border-border/50'
              }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="text-xs text-muted-foreground/60">← 뒤로</button>
        <button
          disabled={pending || !duration}
          onClick={() => onSave({ sportType, durationMin: Number(duration), rpe: rpe ?? undefined })}
          className="flex-1 bg-foreground text-background text-xs font-bold py-1.5 rounded-lg disabled:opacity-30"
        >
          저장
        </button>
      </div>
    </div>
  )
}
