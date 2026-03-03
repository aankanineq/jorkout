'use client'

import { useState } from 'react'

type LiftExercise = {
  name: string
  points: { date: string; weight: number }[]
}

type RunWeek = {
  weekStart: string
  totalKm: number
  count: number
}

type BodyEntry = {
  date: string
  weight: number | null
  bodyFat: number | null
}

type Tab = 'lift' | 'run' | 'body'

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

function BarChart({
  data,
  labelKey,
  valueKey,
  unit,
  color,
}: {
  data: Record<string, unknown>[]
  labelKey: string
  valueKey: string
  unit: string
  color: string
}) {
  if (data.length === 0) return <p className="text-sm text-zinc-400 py-8 text-center">데이터가 없습니다</p>

  const values = data.map((d) => Number(d[valueKey]) || 0)
  const max = Math.max(...values)

  return (
    <div className="space-y-1">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 w-16 shrink-0 text-right">
              {formatShortDate(String(d[labelKey]))}
            </span>
            <div className="flex-1 h-6 bg-zinc-100 rounded overflow-hidden">
              <div
                className={`h-full ${color} rounded flex items-center justify-end pr-2`}
                style={{ width: `${max > 0 ? (val / max) * 100 : 0}%` }}
              >
                {val > 0 && (
                  <span className="text-xs text-white font-medium whitespace-nowrap">
                    {val % 1 === 0 ? val : val.toFixed(1)}{unit}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function StatsView({
  liftData,
  runWeekly,
  bodyData,
}: {
  liftData: LiftExercise[]
  runWeekly: RunWeek[]
  bodyData: BodyEntry[]
}) {
  const [tab, setTab] = useState<Tab>('lift')
  const [selectedLift, setSelectedLift] = useState(0)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'lift', label: '리프팅' },
    { key: 'run', label: '러닝' },
    { key: 'body', label: '체중' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">통계</h1>

      {/* Tab selector */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === t.key
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lift tab */}
      {tab === 'lift' && (
        <div className="space-y-4">
          {liftData.length > 0 ? (
            <>
              <div className="flex gap-2 flex-wrap">
                {liftData.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedLift(i)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      selectedLift === i
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                    }`}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-400">최고 중량 추이</p>
              <BarChart
                data={liftData[selectedLift].points as unknown as Record<string, unknown>[]}
                labelKey="date"
                valueKey="weight"
                unit="kg"
                color="bg-indigo-500"
              />
            </>
          ) : (
            <p className="text-sm text-zinc-400 py-8 text-center">메인 리프트 기록이 없습니다</p>
          )}
        </div>
      )}

      {/* Run tab */}
      {tab === 'run' && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">주간 러닝 거리</p>
          <BarChart
            data={runWeekly as unknown as Record<string, unknown>[]}
            labelKey="weekStart"
            valueKey="totalKm"
            unit="km"
            color="bg-emerald-500"
          />
        </div>
      )}

      {/* Body tab */}
      {tab === 'body' && (
        <div className="space-y-4">
          {bodyData.length > 0 ? (
            <>
              <p className="text-xs text-zinc-400">체중 추이</p>
              <BarChart
                data={bodyData.filter((b) => b.weight != null) as unknown as Record<string, unknown>[]}
                labelKey="date"
                valueKey="weight"
                unit="kg"
                color="bg-zinc-500"
              />
            </>
          ) : (
            <p className="text-sm text-zinc-400 py-8 text-center">체중 기록이 없습니다</p>
          )}
        </div>
      )}
    </div>
  )
}
