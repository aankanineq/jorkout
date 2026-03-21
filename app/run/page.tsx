'use client'

import { useEffect, useState, useCallback } from 'react'
import { Heatmap } from '@/components/Heatmap'
import { RunDetailPanel } from '@/components/DetailPanel'
import { StatCard } from '@/components/StatCard'
import { formatDate, formatPace, formatKm, calcStreak } from '@/lib/utils'
import type { Run } from '@/lib/types'

type RunWithStringDate = Omit<Run, 'date' | 'createdAt' | 'updatedAt'> & {
  date: string
  createdAt: string
  updatedAt: string
}

export default function RunPage() {
  const currentYear = new Date().getUTCFullYear()
  const [year, setYear] = useState(currentYear)
  const [runs, setRuns] = useState<RunWithStringDate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const fetchRuns = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/data?category=run&year=${year}`)
    const json = await res.json()
    setRuns(json.run ?? [])
    setLoading(false)
  }, [year])

  useEffect(() => { fetchRuns() }, [fetchRuns])

  // 히트맵 데이터 (날짜 → km 합산)
  const heatmapData: Record<string, number> = {}
  for (const r of runs) {
    heatmapData[r.date] = (heatmapData[r.date] ?? 0) + r.km
  }

  // 선택된 날짜의 러닝 목록
  const selectedRuns = selectedDate
    ? runs.filter((r) => r.date === selectedDate)
    : []

  // 통계
  const activeDates = new Set(runs.map((r) => r.date))
  const totalKm = runs.reduce((s, r) => s + r.km, 0)
  const totalMin = runs.reduce((s, r) => s + r.minutes, 0)
  const avgPace = totalKm > 0 ? totalMin / totalKm : null

  const handleDelete = async (id: string) => {
    await fetch('/api/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'run', id }),
    })
    fetchRuns()
    setSelectedDate(null)
  }

  const handleUpdate = async (id: string, data: Partial<Pick<Run, 'km' | 'minutes'>>) => {
    await fetch('/api/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'run', id, updates: data }),
    })
    fetchRuns()
  }

  // DetailPanel에 넘길 타입 변환
  const selectedRunsForPanel: Run[] = selectedRuns.map((r) => ({
    ...r,
    date: new Date(r.date),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

      {/* 헤더 + 연도 네비게이션 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: 'var(--run-4)' }}>Run</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setYear(y => y - 1)}
            className="text-sm px-2 py-1 rounded transition-colors"
            style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
            ◀
          </button>
          <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--text)' }}>
            {year}
          </span>
          <button onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            className="text-sm px-2 py-1 rounded transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
            ▶
          </button>
        </div>
      </div>

      {/* 히트맵 */}
      <div className="rounded-lg p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {loading ? (
          <div className="h-24 flex items-center justify-center text-xs"
            style={{ color: 'var(--text-muted)' }}>로딩 중...</div>
        ) : (
          <Heatmap
            data={heatmapData}
            category="run"
            year={year}
            onDayClick={(date) => setSelectedDate(selectedDate === date ? null : date)}
            selectedDate={selectedDate}
          />
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="총 거리" value={formatKm(Math.round(totalKm))} />
        <StatCard label="총 시간" value={`${Math.floor(totalMin / 60)}h ${totalMin % 60}m`} />
        <StatCard label="활동일" value={String(activeDates.size)} sub="일" />
        <StatCard label="평균 페이스" value={formatPace(avgPace)} sub="분/km" />
      </div>

      {/* 날짜 상세 패널 */}
      {selectedDate && (
        <RunDetailPanel
          date={selectedDate}
          runs={selectedRunsForPanel}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}

    </div>
  )
}
