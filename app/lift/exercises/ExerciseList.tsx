'use client'

import { useState } from 'react'
import { createExercise, updateExercise, deleteExercise } from '@/app/actions/exercise'

const SPLIT_TYPES = ['PUSH', 'PULL', 'LEG'] as const
const SPLIT_LABEL: Record<string, string> = {
  PUSH: '푸시',
  PULL: '풀',
  LEG: '레그',
}
const ROLE_TYPES = ['MAIN', 'VOLUME'] as const
const ROLE_LABEL: Record<string, string> = {
  MAIN: '메인',
  VOLUME: '볼륨',
}

type Exercise = {
  id: string
  name: string
  splitType: string
  role: string
  targetSets: number
  targetMinReps: number
  targetMaxReps: number
  order: number
  notes: string | null
}

type GroupedExercises = {
  splitType: string
  exercises: Exercise[]
}

type FormState = {
  id?: string
  name: string
  splitType: string
  role: string
  targetSets: number
  targetMinReps: number
  targetMaxReps: number
  order: number
  notes: string
}

const EMPTY_FORM: FormState = {
  name: '', splitType: 'PUSH', role: 'MAIN',
  targetSets: 2, targetMinReps: 5, targetMaxReps: 8, order: 0, notes: '',
}

export default function ExerciseList({ grouped }: { grouped: GroupedExercises[] }) {
  const [form, setForm] = useState<FormState | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function openNew(splitType?: string) {
    setForm({ ...EMPTY_FORM, splitType: splitType ?? 'PUSH' })
  }

  function openEdit(ex: Exercise) {
    setForm({
      id: ex.id,
      name: ex.name,
      splitType: ex.splitType,
      role: ex.role,
      targetSets: ex.targetSets,
      targetMinReps: ex.targetMinReps,
      targetMaxReps: ex.targetMaxReps,
      order: ex.order,
      notes: ex.notes ?? '',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !form.name.trim()) return
    setSubmitting(true)

    const data = {
      name: form.name.trim(),
      splitType: form.splitType,
      role: form.role,
      targetSets: form.targetSets,
      targetMinReps: form.targetMinReps,
      targetMaxReps: form.targetMaxReps,
      order: form.order,
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

              {/* 분할 */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">분할</label>
                <div className="flex flex-wrap gap-2">
                  {SPLIT_TYPES.map((code: any) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setForm({ ...form, splitType: code })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${form.splitType === code
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                        }`}
                    >
                      {SPLIT_LABEL[code]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 역할 */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">역할</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_TYPES.map((role: any) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        role,
                        targetSets: role === 'MAIN' ? 2 : 2,
                        targetMinReps: role === 'MAIN' ? 5 : 8,
                        targetMaxReps: role === 'MAIN' ? 8 : 12,
                      })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${form.role === role
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                        }`}
                    >
                      {ROLE_LABEL[role]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 세트/렙 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-600">세트</label>
                  <input
                    type="number"
                    value={form.targetSets}
                    onChange={(e) => setForm({ ...form, targetSets: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2.5 text-zinc-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-600">최소렙</label>
                  <input
                    type="number"
                    value={form.targetMinReps}
                    onChange={(e) => setForm({ ...form, targetMinReps: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2.5 text-zinc-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-600">최대렙</label>
                  <input
                    type="number"
                    value={form.targetMaxReps}
                    onChange={(e) => setForm({ ...form, targetMaxReps: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2.5 text-zinc-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 순서 */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">순서</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-2.5 text-zinc-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

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

        {/* 운동 목록 (분할별) */}
        {grouped.map((group: any) => (
          <div key={group.splitType} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {SPLIT_LABEL[group.splitType]}
              </h2>
              <button
                onClick={() => openNew(group.splitType)}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                + 추가
              </button>
            </div>
            {group.exercises.length > 0 ? (
              <div className="space-y-1">
                {group.exercises.map((ex: any) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ex.role === 'MAIN' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                        {ROLE_LABEL[ex.role]}
                      </span>
                      <span className="text-sm text-zinc-700">{ex.name}</span>
                      <span className="text-xs text-zinc-400">
                        {ex.targetSets}×{ex.targetMinReps}-{ex.targetMaxReps}
                      </span>
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
