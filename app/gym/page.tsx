'use client'

import { useEffect, useState, useCallback } from 'react'
import { Heatmap } from '@/components/Heatmap'
import { GymDetailPanel } from '@/components/DetailPanel'
import { StatCard } from '@/components/StatCard'
import { formatDate, calcStreak, formatVolume } from '@/lib/utils'
import type { Gym } from '@/lib/types'

type GymWithStringDate = Omit<Gym, 'date' | 'createdAt' | 'updatedAt'> & {
  date: string
  createdAt: string
  updatedAt: string
}

export default function GymPage() {
  const currentYear = new Date().getUTCFullYear()
  const [year, setYear] = useState(currentYear)
  const [gyms, setGyms] = useState<GymWithStringDate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const fetchGyms = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/data?category=gym&year=${year}`)
    const json = await res.json()
    setGyms(json.gym ?? [])
    setLoading(false)
  }, [year])

  useEffect(() => { fetchGyms() }, [fetchGyms])

  // 히트맵 데이터 (날짜 → 유니크 종목 수)
  const heatmapData: Record<string, number> = {}
  const byDate: Record<string, Set<string>> = {}
  for (const g of gyms) {
    if (!byDate[g.date]) byDate[g.date] = new Set()
    byDate[g.date].add(g.exercise)
  }
  for (const [d, set] of Object.entries(byDate)) {
    heatmapData[d] = set.size
  }

  const selectedGyms = selectedDate ? gyms.filter((g) => g.date === selectedDate) : []

  // 통계
  const activeDates = new Set(gyms.map((g) => g.date))
  const totalVolume = gyms.reduce((s, g) => s + (g.volume ?? 0), 0)
  const allExercises = new Set(gyms.map((g) => g.exercise))

  const handleDelete = async (id: string) => {
    await fetch('/api/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'gym', id }),
    })
    fetchGyms()
    setSelectedDate(null)
  }

  const handleUpdate = async (
    id: string,
    data: Partial<Pick<Gym, 'sets' | 'reps' | 'weight' | 'rpe' | 'memo'>>,
  ) => {
    await fetch('/api/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'gym', id, updates: data }),
    })
    fetchGyms()
  }

  const selectedGymsForPanel: Gym[] = selectedGyms.map((g) => ({
    ...g,
    date: new Date(g.date),
    createdAt: new Date(g.createdAt),
    updatedAt: new Date(g.updatedAt),
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

      {/* 헤더 + 연도 네비게이션 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: 'var(--gym-4)' }}>Gym</h1>
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
            category="gym"
            year={year}
            onDayClick={(date) => setSelectedDate(selectedDate === date ? null : date)}
            selectedDate={selectedDate}
          />
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="총 볼륨" value={formatVolume(Math.round(totalVolume))} />
        <StatCard label="활동일" value={String(activeDates.size)} sub="일" />
        <StatCard label="연속" value={String(calcStreak(activeDates))} sub="일" />
        <StatCard label="종목 수" value={String(allExercises.size)} sub="가지" />
      </div>

      {/* 날짜 상세 패널 */}
      {selectedDate && (
        <GymDetailPanel
          date={selectedDate}
          gyms={selectedGymsForPanel}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}

    </div>
  )
}
