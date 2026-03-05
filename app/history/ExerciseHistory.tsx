'use client'

import { useState, useTransition } from 'react'
import { deleteActivity } from '@/app/actions/activity'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type LiftSet = { weight: number; reps: number }
type ExerciseLog = { id: string; exerciseName: string; isMain: boolean; sets: LiftSet[] }
type LiftSession = {
  id: string; activityId: string; date: string; liftType: string;
  duration: number | null; exerciseLogs: ExerciseLog[]
}
type RunSession = {
  id: string; activityId: string; date: string;
  runType: string; distanceKm: number; durationSec: number; avgPace: number
}

type LiftConfig = {
  liftType: string
  tm: number
  weekLabel: string
  tmIncrement: number
}

type Props = {
  bench: LiftSession[]
  squat: LiftSession[]
  ohp: LiftSession[]
  dead: LiftSession[]
  run: RunSession[]
  configs: Record<string, LiftConfig>
  liftNames: Record<string, string>
}

const LIFT_KEYS = ['bench', 'squat', 'ohp', 'dead'] as const
const DEFAULT_LABELS: Record<string, string> = {
  bench: 'Bench', squat: 'Squat', ohp: 'OHP', dead: 'Dead',
}

const PHASE_LABELS = ['5', '3', '1', 'D']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function ExerciseHistory({ bench, squat, ohp, dead, run, configs, liftNames }: Props) {
  const [expandedRun, setExpandedRun] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const liftMap: Record<string, LiftSession[]> = { bench, squat, ohp, dead }

  return (
    <div className="space-y-4">
      <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">운동별 기록</h2>

      {/* Lift */}
      <div className="rounded-2xl shadow-sm overflow-hidden"
        style={{ background: 'var(--color-lift-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-lift-border)' }}>

        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-lift)' }} />
            <span className="font-semibold">Lift</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {bench.length + squat.length + ohp.length + dead.length}회
          </span>
        </div>

        <div className="px-5 pb-4 space-y-2">
          {LIFT_KEYS.map((key) => {
            const label = liftNames[key.toUpperCase()] || DEFAULT_LABELS[key]
            const sessions = liftMap[key]
            const config = configs[key]
            const chronological = [...sessions].reverse()

            // 가장 최근 사이클의 세션들
            const currentCycleStart = Math.floor(chronological.length / 4) * 4
            const currentCycleSessions = chronological.slice(currentCycleStart)
            const currentPhase = currentCycleSessions.length // 0~3: 다음에 할 phase

            return (
              <div key={key} className="rounded-xl bg-background/40 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{label}</span>
                  {config && (
                    <span className="text-xs text-muted-foreground font-mono">{config.tm}kg</span>
                  )}
                </div>

                <div className="flex gap-1">
                  {PHASE_LABELS.map((phaseLabel, i) => {
                    const isDone = i < currentPhase
                    const isCurrent = i === currentPhase
                    const session = isDone ? currentCycleSessions[i] : null

                    return (
                      <div
                        key={i}
                        className="flex-1 h-10 rounded-md flex flex-col items-center justify-center"
                        style={
                          isDone
                            ? { background: 'var(--color-lift)', color: '#fff' }
                            : isCurrent
                              ? { borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--color-lift)', color: 'var(--color-lift)' }
                              : { borderWidth: 2, borderStyle: 'dashed', borderColor: 'var(--color-lift-border)', color: 'var(--color-lift-border)' }
                        }
                      >
                        <span className="text-xs font-bold leading-none">{phaseLabel}</span>
                        {session && (
                          <span className="text-[9px] mt-0.5 opacity-75 leading-none">{formatDate(session.date)}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Run */}
      <div className="rounded-2xl shadow-sm overflow-hidden"
        style={{ background: 'var(--color-run-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-run-border)' }}>
        <button
          onClick={() => setExpandedRun(!expandedRun)}
          className="w-full px-5 py-4 text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-run)' }} />
              <span className="font-semibold">Run</span>
            </div>
            <div className="flex items-center gap-3">
              {run.length > 0 && (
                <span className="text-sm text-muted-foreground font-mono">
                  {run.reduce((s, r) => s + r.distanceKm, 0).toFixed(1)}km
                </span>
              )}
              <span className="text-xs text-muted-foreground">{run.length}회</span>
            </div>
          </div>
        </button>

        {expandedRun && (
          <div className="px-5 pb-4 space-y-1.5">
            {run.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-2">기록 없음</div>
            ) : run.map(r => {
              const paceMin = Math.floor(r.avgPace / 60)
              const paceSec = (r.avgPace % 60).toString().padStart(2, '0')
              return (
                <div key={r.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-background/30">
                  <span className="text-xs text-muted-foreground tabular-nums w-11 shrink-0">{formatDate(r.date)}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: 'var(--color-run)',
                      color: '#fff',
                      opacity: r.runType === 'EASY' ? 0.6 : r.runType === 'LONG' ? 0.8 : 1,
                    }}>{r.runType}</span>
                  <span className="font-mono text-sm">{r.distanceKm}km</span>
                  <span className="text-xs text-muted-foreground">{paceMin}:{paceSec}/km</span>
                  <button
                    disabled={pending}
                    onClick={() => {
                      if (!confirm('삭제할까요?')) return
                      startTransition(async () => { await deleteActivity(r.activityId); router.refresh() })
                    }}
                    className="ml-auto text-muted-foreground/30 hover:text-red-500 transition-colors disabled:opacity-30 shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
