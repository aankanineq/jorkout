'use client'

import { useState } from 'react'
import { createSportSession } from '@/app/actions/sportSession'
import Link from 'next/link'

const SPORT_TYPES = [
  { value: 'TENNIS', label: '🎾 테니스' },
  { value: 'SOCCER', label: '⚽ 축구' },
  { value: 'OTHER', label: '기타' },
]

export default function SportLogPage() {
  const [sportType, setSportType] = useState('TENNIS')
  const [duration, setDuration] = useState('')
  const [rpe, setRpe] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-white/40">← 홈</Link>
        <h1 className="font-bold">스포츠 기록</h1>
        <div />
      </div>

      {/* 종목 */}
      <div className="space-y-2">
        <label className="text-sm text-white/60">종목</label>
        <div className="flex gap-2">
          {SPORT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setSportType(t.value)}
              className={`flex-1 py-2 rounded-lg text-sm ${
                sportType === t.value ? 'bg-white text-black' : 'bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 시간 */}
      <div className="space-y-2">
        <label className="text-sm text-white/60">시간</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="90"
            className="bg-white/10 rounded-lg px-3 py-2 text-lg w-24"
          />
          <span className="text-white/40">분</span>
        </div>
      </div>

      {/* RPE */}
      <div className="space-y-2">
        <label className="text-sm text-white/60">RPE</label>
        <div className="flex gap-1">
          {[3, 4, 5, 6, 7, 8, 9].map((v) => (
            <button
              key={v}
              onClick={() => setRpe(rpe === v ? null : v)}
              className={`w-9 h-9 rounded-full text-sm ${
                rpe === v ? 'bg-white text-black' : 'bg-white/10'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <label className="text-sm text-white/60">메모 (선택)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-white/10 rounded-lg px-3 py-2 w-full text-sm"
        />
      </div>

      {/* 저장 */}
      <form action={async () => {
        if (!duration) return
        await createSportSession({
          sportType,
          durationMin: Number(duration),
          rpe: rpe ?? undefined,
          notes: notes || undefined,
        })
      }}>
        <button
          disabled={!duration}
          className="w-full bg-white text-black font-bold py-3 rounded-lg disabled:opacity-30"
        >
          저장
        </button>
      </form>
    </div>
  )
}
