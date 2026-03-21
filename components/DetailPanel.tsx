'use client'

import { useState } from 'react'
import { formatPace } from '@/lib/utils'
import type { Run, Gym } from '@/lib/types'

// ============================================================
// 러닝 상세 패널
// ============================================================
type RunDetailPanelProps = {
  date: string
  runs: Run[]
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Pick<Run, 'km' | 'minutes'>>) => void
}

export function RunDetailPanel({ date, runs, onDelete, onUpdate }: RunDetailPanelProps) {
  if (runs.length === 0) {
    return (
      <PanelWrapper date={date}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>기록 없음</p>
      </PanelWrapper>
    )
  }

  return (
    <PanelWrapper date={date}>
      <div className="flex flex-col gap-3">
        {runs.map((run) => (
          <RunRow key={run.id} run={run} onDelete={onDelete} onUpdate={onUpdate} />
        ))}
      </div>
    </PanelWrapper>
  )
}

function RunRow({ run, onDelete, onUpdate }: {
  run: Run
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Pick<Run, 'km' | 'minutes'>>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [km, setKm] = useState(String(run.km))
  const [minutes, setMinutes] = useState(String(run.minutes))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(run.id, { km: parseFloat(km), minutes: parseInt(minutes) })
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-md p-3 flex flex-col gap-2"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex gap-2">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>거리 (km)</span>
            <input type="number" step="0.1" value={km} onChange={e => setKm(e.target.value)}
              className="px-2 py-1 text-sm rounded"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>시간 (분)</span>
            <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)}
              className="px-2 py-1 text-sm rounded"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-1.5 text-xs rounded font-medium"
            style={{ background: 'var(--run-3)', color: '#fff' }}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <button onClick={() => setEditing(false)}
            className="flex-1 py-1.5 text-xs rounded"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md p-3 flex items-center justify-between gap-4"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--run-4)' }}>
          {run.km}km
        </span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--text-dim)' }}>
          {run.minutes}분 · {formatPace(run.pace)}/km
        </span>
      </div>
      <div className="flex gap-1">
        <button onClick={() => setEditing(true)}
          className="px-2 py-1 text-xs rounded"
          style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          수정
        </button>
        <button onClick={() => onDelete(run.id)}
          className="px-2 py-1 text-xs rounded"
          style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          삭제
        </button>
      </div>
    </div>
  )
}

// ============================================================
// 웨이트 상세 패널
// ============================================================
type GymDetailPanelProps = {
  date: string
  gyms: Gym[]
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Pick<Gym, 'sets' | 'reps' | 'weight' | 'rpe' | 'memo'>>) => void
}

export function GymDetailPanel({ date, gyms, onDelete, onUpdate }: GymDetailPanelProps) {
  if (gyms.length === 0) {
    return (
      <PanelWrapper date={date}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>기록 없음</p>
      </PanelWrapper>
    )
  }

  return (
    <PanelWrapper date={date}>
      <div className="flex flex-col gap-3">
        {gyms.map((gym) => (
          <GymRow key={gym.id} gym={gym} onDelete={onDelete} onUpdate={onUpdate} />
        ))}
      </div>
    </PanelWrapper>
  )
}

function GymRow({ gym, onDelete, onUpdate }: {
  gym: Gym
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Pick<Gym, 'sets' | 'reps' | 'weight' | 'rpe' | 'memo'>>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [sets, setSets] = useState(String(gym.sets))
  const [reps, setReps] = useState(String(gym.reps))
  const [weight, setWeight] = useState(String(gym.weight))
  const [rpe, setRpe] = useState(gym.rpe != null ? String(gym.rpe) : '')
  const [memo, setMemo] = useState(gym.memo ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(gym.id, {
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: parseFloat(weight),
      rpe: rpe !== '' ? parseFloat(rpe) : null,
      memo: memo || null,
    })
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-md p-3 flex flex-col gap-2"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '세트', value: sets, set: setSets },
            { label: '렙', value: reps, set: setReps },
            { label: '무게(kg)', value: weight, set: setWeight },
          ].map(({ label, value, set }) => (
            <label key={label} className="flex flex-col gap-1">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <input type="number" step="any" value={value} onChange={e => set(e.target.value)}
                className="px-2 py-1 text-sm rounded"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>RPE</span>
            <input type="number" step="0.5" min="0" max="10" value={rpe} onChange={e => setRpe(e.target.value)}
              placeholder="–" className="px-2 py-1 text-sm rounded"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>메모</span>
            <input type="text" value={memo} onChange={e => setMemo(e.target.value)}
              className="px-2 py-1 text-sm rounded"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-1.5 text-xs rounded font-medium"
            style={{ background: 'var(--gym-3)', color: '#fff' }}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <button onClick={() => setEditing(false)}
            className="flex-1 py-1.5 text-xs rounded"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md p-3"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-bold truncate" style={{ color: 'var(--gym-4)' }}>
            {gym.exercise}
          </span>
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-dim)' }}>
            {gym.raw} &nbsp;|&nbsp; vol {gym.volume?.toLocaleString() ?? '–'}kg
            {gym.rpe != null && ` · RPE ${gym.rpe}`}
          </span>
          {gym.memo && (
            <span className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{gym.memo}</span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setEditing(true)}
            className="px-2 py-1 text-xs rounded"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            수정
          </button>
          <button onClick={() => onDelete(gym.id)}
            className="px-2 py-1 text-xs rounded"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 공통 패널 래퍼
// ============================================================
function PanelWrapper({ date, children }: { date: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-4 flex flex-col gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{date}</div>
      {children}
    </div>
  )
}
