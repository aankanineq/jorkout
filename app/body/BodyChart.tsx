'use client'

import { useState, useTransition } from 'react'
import { deleteBodyLog } from '@/app/actions/bodyLog'

type LogEntry = {
  id: string
  date: string
  weight: number | null
  bodyFat: number | null
  muscleMass: number | null
}

export function BodyChart({ logs }: { logs: LogEntry[] }) {
  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const [selected, setSelected] = useState<LogEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  if (sorted.length < 2) {
    return <p className="text-muted-foreground/60 text-sm py-6 text-center">데이터가 부족합니다 (최소 2일)</p>
  }

  const weights = sorted.map(l => l.weight).filter((v): v is number => v != null)
  const muscles = sorted.map(l => l.muscleMass).filter((v): v is number => v != null)
  const fats = sorted.map(l => l.bodyFat).filter((v): v is number => v != null)

  const kgValues = [...weights, ...muscles]
  const pctValues = fats

  const kgMin = kgValues.length ? Math.min(...kgValues) : 0
  const kgMax = kgValues.length ? Math.max(...kgValues) : 100
  const kgPad = (kgMax - kgMin || 1) * 0.2
  const kgLo = kgMin - kgPad
  const kgHi = kgMax + kgPad

  const pctMin = pctValues.length ? Math.min(...pctValues) : 0
  const pctMax = pctValues.length ? Math.max(...pctValues) : 30
  const pctPad = (pctMax - pctMin || 1) * 0.2
  const pctLo = pctMin - pctPad
  const pctHi = pctMax + pctPad

  const W = 320
  const H = 150
  const padL = 32
  const padR = 28
  const padT = 14
  const padB = 22
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const tMin = new Date(sorted[0].date).getTime()
  const tMax = new Date(sorted[sorted.length - 1].date).getTime()
  const tRange = tMax - tMin || 1

  function xOf(date: string) {
    return padL + ((new Date(date).getTime() - tMin) / tRange) * plotW
  }
  function yKg(v: number) {
    return padT + (1 - (v - kgLo) / (kgHi - kgLo)) * plotH
  }
  function yPct(v: number) {
    return padT + (1 - (v - pctLo) / (pctHi - pctLo)) * plotH
  }

  // x축 날짜 라벨
  const labelCount = Math.min(sorted.length, 6)
  const labelStep = Math.max(1, Math.floor((sorted.length - 1) / (labelCount - 1)))
  const xLabels: { x: number; text: string; logIdx: number }[] = []
  for (let i = 0; i < sorted.length; i += labelStep) {
    const d = new Date(sorted[i].date)
    xLabels.push({ x: xOf(sorted[i].date), text: `${d.getMonth() + 1}/${d.getDate()}`, logIdx: i })
  }
  const lastX = xOf(sorted[sorted.length - 1].date)
  if (!xLabels.length || Math.abs(xLabels[xLabels.length - 1].x - lastX) > 15) {
    const lastD = new Date(sorted[sorted.length - 1].date)
    xLabels.push({ x: lastX, text: `${lastD.getMonth() + 1}/${lastD.getDate()}`, logIdx: sorted.length - 1 })
  }

  const kgTicks = [kgLo, kgLo + (kgHi - kgLo) / 2, kgHi].map(v => +v.toFixed(0))
  const pctTicks = [pctLo, pctLo + (pctHi - pctLo) / 2, pctHi].map(v => +v.toFixed(0))

  type Pt = { x: number; y: number; value: number; label: string }

  function buildLine(key: 'weight' | 'muscleMass' | 'bodyFat', yFn: (v: number) => number): Pt[] {
    const pts: Pt[] = []
    for (const log of sorted) {
      const v = log[key]
      if (v != null) {
        const d = new Date(log.date)
        pts.push({ x: xOf(log.date), y: yFn(v), value: v, label: `${d.getMonth() + 1}/${d.getDate()}` })
      }
    }
    return pts
  }

  function toPath(pts: Pt[]) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  }

  const lines: { pts: Pt[]; color: string; label: string }[] = [
    { pts: buildLine('weight', yKg), color: '#3b82f6', label: '체중' },
    { pts: buildLine('muscleMass', yKg), color: '#22c55e', label: '근육량' },
    { pts: buildLine('bodyFat', yPct), color: '#f97316', label: '체지방' },
  ].filter(l => l.pts.length >= 2)

  // 날짜별 클릭 영역 (세로 스트립)
  const clickZones = sorted.map((log, i) => {
    const x = xOf(log.date)
    const prevX = i > 0 ? xOf(sorted[i - 1].date) : padL
    const nextX = i < sorted.length - 1 ? xOf(sorted[i + 1].date) : W - padR
    const left = (prevX + x) / 2
    const right = (x + nextX) / 2
    return { log, x, left, right }
  })

  function handleDelete() {
    if (!selected) return
    startTransition(async () => {
      await deleteBodyLog(selected.id)
      setSelected(null)
    })
  }

  const fmt = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`
  }

  return (
    <div className="space-y-2">
      {/* 범례 */}
      <div className="flex gap-4 justify-center">
        {[
          { color: '#3b82f6', label: '체중(kg)' },
          { color: '#22c55e', label: '근육량(kg)' },
          { color: '#f97316', label: '체지방(%)' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* grid */}
        {[0, 0.5, 1].map(pct => {
          const y = padT + (1 - pct) * plotH
          return <line key={pct} x1={padL} y1={y} x2={W - padR} y2={y} stroke="currentColor" strokeOpacity="0.06" />
        })}

        {/* y축 라벨 - kg (좌) */}
        {kgValues.length > 0 && kgTicks.map((v, i) => (
          <text key={`kg${i}`} x={padL - 4} y={yKg(v) + 3} textAnchor="end" fill="#3b82f6" fontSize="7" opacity="0.5">{v}</text>
        ))}

        {/* y축 라벨 - % (우) */}
        {pctValues.length > 0 && pctTicks.map((v, i) => (
          <text key={`pct${i}`} x={W - padR + 4} y={yPct(v) + 3} textAnchor="start" fill="#f97316" fontSize="7" opacity="0.5">{v}</text>
        ))}

        {/* x축 라벨 */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - 4} textAnchor="middle" fill="currentColor" fontSize="7" opacity="0.35">{l.text}</text>
        ))}

        {/* selected 세로선 */}
        {selected && (
          <line x1={xOf(selected.date)} y1={padT} x2={xOf(selected.date)} y2={padT + plotH}
            stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3,3" />
        )}

        {/* lines + dots */}
        {lines.map(({ pts, color, label }) => (
          <g key={label}>
            <path d={toPath(pts)} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />
            ))}
          </g>
        ))}

        {/* 클릭 영역 */}
        {clickZones.map(({ log, left, right }, i) => (
          <rect key={i} x={left} y={0} width={right - left} height={H}
            fill="transparent" className="cursor-pointer"
            onClick={() => setSelected(selected?.id === log.id ? null : log)} />
        ))}
      </svg>

      {/* 선택된 날짜 정보 + 삭제 */}
      {selected && (
        <div className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2 text-sm">
          <div className="space-x-2">
            <span className="text-muted-foreground">{fmt(selected.date)}</span>
            {selected.weight != null && <span>{selected.weight}kg</span>}
            {selected.muscleMass != null && <span className="text-green-500">{selected.muscleMass}kg</span>}
            {selected.bodyFat != null && <span className="text-orange-500">{selected.bodyFat}%</span>}
          </div>
          <button onClick={handleDelete} disabled={isPending}
            className="text-red-500 text-xs font-medium hover:text-red-400 transition-colors disabled:opacity-50">
            {isPending ? '삭제중...' : '삭제'}
          </button>
        </div>
      )}
    </div>
  )
}
