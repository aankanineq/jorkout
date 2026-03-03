'use client'

import { useState } from 'react'
import { createCycle } from '@/app/actions/createCycle'

const MODULE_CODES = ['SQ', 'HN', 'PU', 'VU', 'PL', 'RL'] as const
const MODULE_LABEL: Record<string, string> = {
  SQ: '스쿼트',
  HN: '힙힌지',
  PU: '수평푸시',
  VU: '수직푸시',
  PL: '수직풀',
  RL: '수평풀',
}
const DAY_LABELS = ['A', 'B', 'C', 'D']

export default function NewCyclePage() {
  const [splitCount, setSplitCount] = useState<number | null>(null)
  const [splitModules, setSplitModules] = useState<string[][]>([])
  const [pending, setPending] = useState(false)

  function handleSplitCount(count: number) {
    setSplitCount(count)
    setSplitModules(Array.from({ length: count }, () => []))
  }

  function toggleModule(splitIndex: number, mod: string) {
    setSplitModules((prev) =>
      prev.map((modules, i) => {
        if (i !== splitIndex) return modules
        return modules.includes(mod)
          ? modules.filter((m: any) => m !== mod)
          : [...modules, mod]
      }),
    )
  }

  const canSubmit =
    splitCount !== null &&
    splitModules.every((mods: any) => mods.length > 0) &&
    !pending

  async function handleSubmit() {
    if (!splitCount || !canSubmit) return
    setPending(true)
    const splits = splitModules.map((modules, i) => ({
      dayLabel: DAY_LABELS[i],
      modules,
    }))
    await createCycle(splitCount, splits)
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">새 사이클</h1>
          <p className="mt-1 text-sm text-zinc-500">분할 수를 선택하고 각 분할에 모듈을 배정하세요</p>
        </div>

        {/* Step 1: 분할 수 선택 */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">분할 수</h2>
          <div className="flex gap-3">
            {[2, 3, 4].map((n: any) => (
              <button
                key={n}
                onClick={() => handleSplitCount(n)}
                className={`px-6 py-3 rounded-xl text-lg font-semibold transition-colors ${splitCount === n
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
              >
                {n}분할
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: 모듈 배정 */}
        {splitCount !== null && (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">모듈 배정</h2>
            {splitModules.map((modules, splitIdx) => (
              <div key={splitIdx} className="rounded-xl bg-zinc-50 border border-zinc-200 px-5 py-4 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">Split {DAY_LABELS[splitIdx]}</h3>
                <div className="flex flex-wrap gap-2">
                  {MODULE_CODES.map((mod: any) => {
                    const active = modules.includes(mod)
                    return (
                      <button
                        key={mod}
                        onClick={() => toggleModule(splitIdx, mod)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
                          }`}
                      >
                        {MODULE_LABEL[mod]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 생성 버튼 */}
        {splitCount !== null && (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? '생성 중...' : '사이클 생성'}
          </button>
        )}
      </div>
    </div>
  )
}
