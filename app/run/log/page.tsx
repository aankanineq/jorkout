'use client'

import { useState, Suspense } from 'react'
import { createRunSession } from '@/app/actions/runSession'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const RUN_TYPES = ['EASY', 'QUALITY', 'LONG'] as const

export default function RunLogPage() {
  return (
    <Suspense>
      <RunLogInner />
    </Suspense>
  )
}

function RunLogInner() {
  const searchParams = useSearchParams()
  const suggested = searchParams.get('type') || 'EASY'

  const [runType, setRunType] = useState(suggested)
  const [distance, setDistance] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [notes, setNotes] = useState('')

  const distNum = Number(distance) || 0
  const totalSec = (Number(minutes) || 0) * 60 + (Number(seconds) || 0)
  const pace = distNum > 0 && totalSec > 0
    ? Math.round(totalSec / distNum)
    : 0
  const paceMin = Math.floor(pace / 60)
  const paceSec = pace % 60

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-muted-foreground/80">← 홈</Link>
        <h1 className="font-bold">러닝 기록</h1>
        <div />
      </div>

      {/* 타입 선택 */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground font-medium">타입</label>
        <div className="flex gap-2">
          {RUN_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setRunType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                runType === t ? 'bg-foreground text-background' : 'bg-muted border border-border/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 거리 */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground font-medium">거리</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="0.0"
            className="bg-muted border border-border/50 rounded-lg px-3 py-2 text-lg w-full"
          />
          <span className="text-muted-foreground/80">km</span>
        </div>
      </div>

      {/* 시간 */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground font-medium">시간</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="00"
            className="bg-muted border border-border/50 rounded-lg px-3 py-2 text-lg w-20 text-center"
          />
          <span>:</span>
          <input
            type="number"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            placeholder="00"
            className="bg-muted border border-border/50 rounded-lg px-3 py-2 text-lg w-20 text-center"
          />
        </div>
      </div>

      {/* 페이스 미리보기 */}
      {pace > 0 && (
        <div className="text-sm text-muted-foreground">
          → 페이스: {paceMin}:{paceSec.toString().padStart(2, '0')} /km
        </div>
      )}

      {/* 메모 */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground font-medium">메모 (선택)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-muted border border-border/50 rounded-lg px-3 py-2 w-full text-sm"
        />
      </div>

      {/* 저장 */}
      <form action={async () => {
        if (!distance || totalSec === 0) return
        await createRunSession({
          distanceKm: distNum,
          durationSec: totalSec,
          runType,
          notes: notes || undefined,
        })
      }}>
        <button
          disabled={!distance || totalSec === 0}
          className="w-full bg-foreground text-background font-bold py-3 rounded-lg disabled:opacity-30"
        >
          저장
        </button>
      </form>
    </div>
  )
}
