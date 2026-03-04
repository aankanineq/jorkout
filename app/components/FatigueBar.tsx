'use client'

import { useState, useTransition } from 'react'
import { adjustFatigue } from '../actions/fatigue'

const ZONE_LABELS: Record<string, string> = {
  push: 'PUSH',
  pull: 'PULL',
  quad: 'QUAD',
  post: 'POST',
  cardio: 'CARDIO',
}

type FatigueState = { push: number; pull: number; quad: number; post: number; cardio: number }

export function FatigueBar({ fatigue: initial }: { fatigue: FatigueState }) {
  const [fatigue, setFatigue] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleChange(zone: keyof FatigueState, value: number) {
    setFatigue((prev) => ({ ...prev, [zone]: value }))
    startTransition(async () => {
      await adjustFatigue(zone, value)
    })
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-end mb-1">
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {editing ? '저장' : '수정'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {(Object.keys(ZONE_LABELS) as (keyof FatigueState)[]).map((zone) => (
          <div key={zone} className="flex items-center gap-3">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground w-12">{ZONE_LABELS[zone]}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fatigue[zone] >= 5 ? 'bg-red-500' : fatigue[zone] >= 3 ? 'bg-foreground/50' : 'bg-foreground'
                  }`}
                style={{ width: `${(fatigue[zone] / 6) * 100}%` }}
              />
            </div>
            {editing ? (
              <select
                value={fatigue[zone]}
                onChange={(e) => handleChange(zone, Number(e.target.value))}
                className="bg-background border border-border text-foreground text-xs rounded-md px-1 py-0.5 w-10 focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-medium text-foreground w-4 text-right">{fatigue[zone]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
