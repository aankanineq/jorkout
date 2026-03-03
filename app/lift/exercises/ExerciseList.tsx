'use client'

import { useState } from 'react'
import { createExercise, updateExercise, deleteExercise } from '@/app/actions/exercise'

const MODULE_CODES = ['SQ', 'HN', 'PU', 'VU', 'PL', 'RL'] as const
const MODULE_LABEL: Record<string, string> = {
  SQ: '스쿼트',
  HN: '힙힌지',
  PU: '수평푸시',
  VU: '수직푸시',
  PL: '수직풀',
  RL: '수평풀',
}

type Exercise = {
  id: string
  name: string
  moduleCode: string
  isMain: boolean
  notes: string | null
}

type GroupedExercises = {
  moduleCode: string
  exercises: Exercise[]
}

type FormState = {
  id?: string
  name: string
  moduleCode: string
  isMain: boolean
  notes: string
}

const EMPTY_FORM: FormState = { name: '', moduleCode: 'SQ', isMain: false, notes: '' }

export default function ExerciseList({ grouped }: { grouped: GroupedExercises[] }) {
  const [form, setForm] = useState<FormState | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function openNew(moduleCode?: string) {
    setForm({ ...EMPTY_FORM, moduleCode: moduleCode ?? 'SQ' })
  }

  function openEdit(ex: Exercise) {
    setForm({
      id: ex.id,
      name: ex.name,
      moduleCode: ex.moduleCode,
      isMain: ex.isMain,
      notes: ex.notes ?? '',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !form.name.trim()) return
    setSubmitting(true)

    const data = {
      name: form.name.trim(),
      moduleCode: form.moduleCode,
      isMain: form.isMain,
      notes: form.notes.trim() || undefined,
    }

    if (form.id) {
      await updateExercise(form.id, data)
    } else {
      await createExercise(data)
    }

    setForm(null)
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('이 운동을 삭제하시겠습니까?')) return
    await deleteExercise(id)
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">운동 라이브러리</h1>
          <button
            onClick={() => openNew()}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            운동 추가
          </button>
        </div>

        {/* 모달 폼 */}
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md mx-4 rounded-xl bg-white border border-zinc-200 shadow-lg p-6 space-y-5"
            >
              <h2 className="text-lg font-semibold text-zinc-900">
                {form.id ? '운동 수정' : '운동 추가'}
              </h2>

              {/* 이름 */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">이름</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="운동 이름"
                  required
                  className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 모듈 */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">모듈</label>
                <div className="flex flex-wrap gap-2">
                  {MODULE_CODES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setForm({ ...form, moduleCode: code })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        form.moduleCode === code
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      {MODULE_LABEL[code]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 메인 여부 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isMain}
                  onChange={(e) => setForm({ ...form, isMain: e.target.checked })}
                  className="rounded bg-zinc-50 border-zinc-300 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-600">메인 리프트</span>
              </label>

              {/* 메모 */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">메모 (선택)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="메모"
                  className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '저장 중...' : form.id ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 운동 목록 (모듈별) */}
        {grouped.map((group) => (
          <div key={group.moduleCode} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {MODULE_LABEL[group.moduleCode]}
              </h2>
              <button
                onClick={() => openNew(group.moduleCode)}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                + 추가
              </button>
            </div>
            {group.exercises.length > 0 ? (
              <div className="space-y-1">
                {group.exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 group"
                  >
                    <div className="flex items-center gap-2">
                      {ex.isMain && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      )}
                      <span className="text-sm text-zinc-700">{ex.name}</span>
                      {ex.notes && (
                        <span className="text-xs text-zinc-400">{ex.notes}</span>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(ex)}
                        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="text-xs text-red-400 hover:text-red-500 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 px-4 py-2">운동 없음</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
