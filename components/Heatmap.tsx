'use client'

import { useMemo } from 'react'
import { getDaysOfYear, runLevel, gymLevel } from '@/lib/utils'
import type { HeatmapCategory } from '@/lib/types'

// ============================================================
// 색상 설정
// ============================================================
const COLORS: Record<HeatmapCategory, string[]> = {
  run: ['var(--run-0)', 'var(--run-1)', 'var(--run-2)', 'var(--run-3)', 'var(--run-4)'],
  gym: ['var(--gym-0)', 'var(--gym-1)', 'var(--gym-2)', 'var(--gym-3)', 'var(--gym-4)'],
}

// ============================================================
// 툴팁 내용 생성
// ============================================================
function tooltipText(
  date: string,
  value: number,
  category: HeatmapCategory,
): string {
  if (value === 0) return date
  if (category === 'run') return `${date} · ${value.toFixed(1)}km`
  return `${date} · ${value}종목`
}

// ============================================================
// 연간 히트맵 컴포넌트
// ============================================================
type HeatmapProps = {
  /** "YYYY-MM-DD" → 강도값 (run: km, gym: 종목수) */
  data: Record<string, number>
  category: HeatmapCategory
  year: number
  onDayClick?: (date: string) => void
  selectedDate?: string | null
}

export function Heatmap({ data, category, year, onDayClick, selectedDate }: HeatmapProps) {
  const { weeks } = useMemo(() => buildWeeks(year), [year])
  const colors = COLORS[category]

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-[3px] min-w-max py-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) =>
              day === null ? (
                <div key={di} style={{ width: 11, height: 11 }} />
              ) : (
                <DayCell
                  key={di}
                  date={day}
                  value={data[day] ?? 0}
                  category={category}
                  colors={colors}
                  selected={selectedDate === day}
                  onClick={onDayClick}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 개별 셀
// ============================================================
type DayCellProps = {
  date: string
  value: number
  category: HeatmapCategory
  colors: string[]
  selected: boolean
  onClick?: (date: string) => void
}

function DayCell({ date, value, category, colors, selected, onClick }: DayCellProps) {
  const level = category === 'run' ? runLevel(value) : gymLevel(value)
  const bg = colors[level]

  return (
    <div
      title={tooltipText(date, value, category)}
      onClick={() => onClick?.(date)}
      style={{
        width: 11,
        height: 11,
        borderRadius: 2,
        background: bg,
        outline: selected ? '2px solid var(--text)' : undefined,
        outlineOffset: selected ? '1px' : undefined,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
      }}
    />
  )
}

// ============================================================
// 미니 히트맵 (대시보드용, 최근 16주)
// ============================================================
type MiniHeatmapProps = {
  data: Record<string, number>
  category: HeatmapCategory
  onDayClick?: (date: string) => void
}

export function MiniHeatmap({ data, category, onDayClick }: MiniHeatmapProps) {
  const weeks = useMemo(() => buildRecentWeeks(16), [])
  const colors = COLORS[category]

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-[3px] min-w-max py-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) =>
              day === null ? (
                <div key={di} style={{ width: 9, height: 9 }} />
              ) : (
                <MiniCell
                  key={di}
                  date={day}
                  value={data[day] ?? 0}
                  category={category}
                  colors={colors}
                  onClick={onDayClick}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

type MiniCellProps = {
  date: string
  value: number
  category: HeatmapCategory
  colors: string[]
  onClick?: (date: string) => void
}

function MiniCell({ date, value, category, colors, onClick }: MiniCellProps) {
  const level = category === 'run' ? runLevel(value) : gymLevel(value)
  return (
    <div
      title={tooltipText(date, value, category)}
      onClick={() => onClick?.(date)}
      style={{
        width: 9,
        height: 9,
        borderRadius: 2,
        background: colors[level],
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
      }}
    />
  )
}

// ============================================================
// 주(Week) 배열 생성 헬퍼
// ============================================================
/** 연간 7행 × N열 배열. 일요일 시작. 빈 칸은 null */
function buildWeeks(year: number): { weeks: (string | null)[][] } {
  const days = getDaysOfYear(year)
  const weeks: (string | null)[][] = []

  // 1월 1일의 요일
  const firstDay = new Date(`${year}-01-01T00:00:00Z`).getUTCDay()

  let week: (string | null)[] = Array(firstDay).fill(null)
  for (const day of days) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  return { weeks }
}

/** 최근 N주 배열 (오늘 기준, 일요일 시작) */
function buildRecentWeeks(n: number): (string | null)[][] {
  const today = new Date()
  const todayDay = today.getUTCDay() // 0=일

  // 이번 주 토요일까지 포함
  const end = new Date(today)
  end.setUTCDate(today.getUTCDate() + (6 - todayDay))

  // n주 전 일요일부터
  const start = new Date(end)
  start.setUTCDate(end.getUTCDate() - (n * 7 - 1))

  const weeks: (string | null)[][] = []
  let week: (string | null)[] = []

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    week.push(d.toISOString().slice(0, 10))
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  return weeks
}
