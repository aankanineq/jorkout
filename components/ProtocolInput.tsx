'use client'

import { useState, useCallback } from 'react'
import { parseProtocol } from '@/lib/parser'
import type { ParsedRecord, ParseError } from '@/lib/types'

// ============================================================
// 프로토콜 레퍼런스
// ============================================================
const PROTOCOL_REFERENCE = `RUN|YYYY-MM-DD|거리km|분
GYM|YYYY-MM-DD|운동명|세트x렙x무게|RPE(선택)|메모(선택)
DEL|run|YYYY-MM-DD         ← 해당 날 전체 삭제
DEL|gym|YYYY-MM-DD|id      ← id로 개별 삭제`

// ============================================================
// 미리보기 행
// ============================================================
function PreviewRow({ record, idx }: { record: ParsedRecord; idx: number }) {
  let content: React.ReactNode
  let color: string

  if (record.type === 'RUN') {
    color = 'var(--run-4)'
    content = (
      <span>
        <span className="font-medium" style={{ color }}>RUN</span>
        {' '}{record.date} · {record.km}km · {record.minutes}분
        <span style={{ color: 'var(--text-muted)' }}> · {(record.pace).toFixed(2)}분/km</span>
      </span>
    )
  } else if (record.type === 'GYM') {
    color = 'var(--gym-4)'
    content = (
      <span>
        <span className="font-medium" style={{ color }}>GYM</span>
        {' '}{record.date} · {record.exercise} · {record.raw}
        {record.rpe != null && <span style={{ color: 'var(--text-muted)' }}> · RPE {record.rpe}</span>}
        {record.memo && <span style={{ color: 'var(--text-muted)' }}> · {record.memo}</span>}
      </span>
    )
  } else {
    color = 'var(--text-dim)'
    content = (
      <span>
        <span className="font-medium" style={{ color }}>DEL</span>
        {' '}{record.category.toUpperCase()} · {record.date}
        {record.id && <span style={{ color: 'var(--text-muted)' }}> · {record.id}</span>}
      </span>
    )
  }

  return (
    <div className="flex items-start gap-2 text-xs py-1">
      <span className="shrink-0 text-[10px] mt-0.5 rounded px-1"
        style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
        {idx + 1}
      </span>
      <span className="text-xs" style={{ color: 'var(--text)' }}>{content}</span>
      <span className="ml-auto shrink-0" style={{ color: 'var(--run-3)' }}>✓</span>
    </div>
  )
}

function ErrorRow({ err }: { err: ParseError }) {
  return (
    <div className="flex items-start gap-2 text-xs py-1">
      <span className="shrink-0 text-[10px] mt-0.5 rounded px-1"
        style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
        L{err.line}
      </span>
      <span style={{ color: '#f85149' }}>
        {err.raw} <span style={{ color: 'var(--text-muted)' }}>— {err.reason}</span>
      </span>
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================
export function ProtocolInput() {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ added: number; errors: string[] } | null>(null)
  const [showRef, setShowRef] = useState(false)

  const parsed = text.trim() ? parseProtocol(text) : { records: [], errors: [] }

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || parsed.records.length === 0) return
    setSaving(true)
    setResult(null)
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol: text }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResult({ added: 0, errors: [json.error ?? '저장 실패'] })
      } else {
        setResult({
          added: json.added,
          errors: (json.errors as { reason: string }[]).map((e) => e.reason),
        })
        if (json.added > 0) setText('')
      }
    } catch {
      setResult({ added: 0, errors: ['네트워크 오류'] })
    } finally {
      setSaving(false)
    }
  }, [text, parsed.records.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 텍스트 입력 */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`RUN|2026-03-21|5.0|28\nGYM|2026-03-21|벤치프레스|3x5x80|8|느낌 좋았다`}
        rows={6}
        className="w-full resize-none rounded-lg p-4 text-sm font-mono focus:outline-none"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          lineHeight: '1.6',
        }}
      />

      {/* 미리보기 */}
      {text.trim() && (
        <div className="rounded-lg p-4 flex flex-col"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] uppercase tracking-wider font-medium mb-2"
            style={{ color: 'var(--text-muted)' }}>
            미리보기 — {parsed.records.length}건 정상
            {parsed.errors.length > 0 && (
              <span style={{ color: '#f85149' }}> · {parsed.errors.length}건 오류</span>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {parsed.records.map((r, i) => <PreviewRow key={i} record={r} idx={i} />)}
            {parsed.errors.map((e, i) => <ErrorRow key={i} err={e} />)}
          </div>
        </div>
      )}

      {/* 저장 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={saving || parsed.records.length === 0}
        className="w-full py-3 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
        style={{ background: 'var(--run-2)', color: 'var(--text)' }}>
        {saving ? '저장 중...' : `저장 (${parsed.records.length}건)`}
        <span className="ml-2 text-xs opacity-60">⌘ Enter</span>
      </button>

      {/* 결과 피드백 */}
      {result && (
        <div className="rounded-lg p-3 text-sm"
          style={{
            background: result.added > 0 ? '#0c2d0c' : '#2d0c0c',
            border: `1px solid ${result.added > 0 ? '#1a5c1a' : '#5c1a1a'}`,
            color: result.added > 0 ? '#58a058' : '#f85149',
          }}>
          {result.added > 0 && `✓ ${result.added}건 추가됨`}
          {result.errors.length > 0 && (
            <div>{result.errors.map((e, i) => <div key={i}>✗ {e}</div>)}</div>
          )}
        </div>
      )}

      {/* 프로토콜 레퍼런스 */}
      <div>
        <button onClick={() => setShowRef(!showRef)}
          className="text-xs flex items-center gap-1 transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          <span>{showRef ? '▾' : '▸'}</span> 프로토콜 레퍼런스
        </button>
        {showRef && (
          <pre className="mt-2 p-4 rounded-lg text-xs overflow-x-auto"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
            }}>
            {PROTOCOL_REFERENCE}
          </pre>
        )}
      </div>
    </div>
  )
}
