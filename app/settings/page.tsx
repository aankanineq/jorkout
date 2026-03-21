'use client'

import { useState, useRef } from 'react'

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    const res = await fetch('/api/data/export')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jo-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      // 프로토콜 라인으로 변환 후 POST
      const lines: string[] = []
      for (const r of json.run ?? []) {
        lines.push(`RUN|${r.date}|${r.km}|${r.minutes}`)
      }
      for (const g of json.gym ?? []) {
        const rpe = g.rpe != null ? g.rpe : ''
        const memo = g.memo ?? ''
        lines.push(`GYM|${g.date}|${g.exercise}|${g.raw}|${rpe}|${memo}`)
      }
      if (lines.length === 0) {
        setImportResult('가져올 데이터가 없습니다.')
        return
      }
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol: lines.join('\n') }),
      })
      const result = await res.json()
      setImportResult(`✓ ${result.added}건 가져옴${result.errors?.length ? ` (${result.errors.length}건 오류)` : ''}`)
    } catch {
      setImportResult('파일 파싱 실패. 올바른 JSON 백업 파일인지 확인하세요.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    setResetting(true)
    await fetch('/api/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'all' }),
    })
    setResetting(false)
    setConfirmReset(false)
    setImportResult('전체 데이터가 초기화되었습니다.')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-8">
      <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Settings</h1>

      {/* JSON 내보내기 */}
      <Section title="JSON 내보내기" desc="전체 데이터를 JSON 파일로 다운로드합니다.">
        <button onClick={handleExport} disabled={exporting}
          className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          {exporting ? '내보내는 중...' : 'JSON 다운로드'}
        </button>
      </Section>

      {/* JSON 가져오기 */}
      <Section title="JSON 가져오기" desc="이전에 내보낸 JSON 파일로 데이터를 복원합니다. 기존 데이터와 병합됩니다.">
        <label className="flex items-center gap-3">
          <span className="px-4 py-2 rounded text-sm font-medium cursor-pointer"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            {importing ? '가져오는 중...' : '파일 선택'}
          </span>
          <input ref={fileRef} type="file" accept=".json" className="hidden"
            onChange={handleImport} disabled={importing} />
        </label>
        {importResult && (
          <p className="text-sm mt-2" style={{ color: importResult.startsWith('✓') ? 'var(--run-3)' : '#f85149' }}>
            {importResult}
          </p>
        )}
      </Section>

      {/* 전체 초기화 */}
      <Section title="전체 초기화" desc="모든 Run, Gym 데이터를 삭제합니다. 되돌릴 수 없습니다.">
        <button onClick={handleReset} disabled={resetting}
          className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
          style={{
            background: confirmReset ? '#5c1a1a' : 'var(--surface)',
            border: `1px solid ${confirmReset ? '#f85149' : 'var(--border)'}`,
            color: confirmReset ? '#f85149' : 'var(--text-dim)',
          }}>
          {resetting ? '초기화 중...' : confirmReset ? '한 번 더 클릭하면 삭제됩니다' : '전체 데이터 초기화'}
        </button>
        {confirmReset && (
          <button onClick={() => setConfirmReset(false)}
            className="ml-2 px-3 py-2 rounded text-sm"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            취소
          </button>
        )}
      </Section>

      {/* 프로토콜 레퍼런스 */}
      <Section title="프로토콜 레퍼런스" desc="">
        <pre className="p-4 rounded-lg text-xs overflow-x-auto leading-relaxed"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
{`RUN|YYYY-MM-DD|거리km|분
GYM|YYYY-MM-DD|운동명|세트x렙x무게|RPE(선택)|메모(선택)
DEL|run|YYYY-MM-DD           ← 해당 날 run 전체 삭제
DEL|gym|YYYY-MM-DD           ← 해당 날 gym 전체 삭제
DEL|run|YYYY-MM-DD|uuid      ← id로 개별 삭제
DEL|gym|YYYY-MM-DD|uuid      ← id로 개별 삭제

예시:
RUN|2026-03-21|5.0|28
GYM|2026-03-21|벤치프레스|3x5x80|8|느낌 좋았다
GYM|2026-03-21|스쿼트|3x5x100|9|`}
        </pre>
      </Section>
    </div>
  )
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 pb-8"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{desc}</p>}
      </div>
      {children}
    </section>
  )
}
