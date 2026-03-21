import type { ParseResult, ParsedRecord, ParseError } from './types'

// ============================================================
// 세트 파싱: "3x5x80" → { sets, reps, weight }
// ============================================================
function parseSets(raw: string): { sets: number; reps: number; weight: number } | null {
  const parts = raw.toLowerCase().split('x')
  if (parts.length !== 3) return null
  const [s, r, w] = parts.map(Number)
  if (isNaN(s) || isNaN(r) || isNaN(w)) return null
  if (s <= 0 || r <= 0 || w < 0) return null
  return { sets: s, reps: r, weight: w }
}

// ============================================================
// 날짜 유효성: "YYYY-MM-DD"
// ============================================================
function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !isNaN(d.getTime())
}

// ============================================================
// 메인 파서
// ============================================================
export function parseProtocol(text: string): ParseResult {
  const records: ParsedRecord[] = []
  const errors: ParseError[] = []

  const lines = text.split('\n')

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim()
    if (!line) return // 빈 줄 무시

    const fields = line.split('|').map((f) => f.trim())
    const category = fields[0]?.toUpperCase()
    const lineNum = idx + 1

    const addError = (reason: string) => {
      errors.push({ line: lineNum, raw: rawLine, reason })
    }

    if (category === 'RUN') {
      // RUN|YYYY-MM-DD|km|minutes
      if (fields.length < 4) return addError('필드 부족 — RUN|날짜|거리km|분')
      const [, date, kmStr, minStr] = fields
      if (!isValidDate(date)) return addError(`날짜 형식 오류: "${date}"`)
      const km = parseFloat(kmStr)
      const minutes = parseInt(minStr, 10)
      if (isNaN(km) || km <= 0) return addError(`거리 오류: "${kmStr}"`)
      if (isNaN(minutes) || minutes <= 0) return addError(`시간 오류: "${minStr}"`)
      records.push({
        type: 'RUN',
        date,
        km,
        minutes,
        pace: minutes / km,
      })
    } else if (category === 'GYM') {
      // GYM|YYYY-MM-DD|운동명|SxRxW|rpe?|memo?
      if (fields.length < 4) return addError('필드 부족 — GYM|날짜|운동명|세트x렙x무게')
      const [, date, exercise, setsRaw, rpeStr, ...memoParts] = fields
      if (!isValidDate(date)) return addError(`날짜 형식 오류: "${date}"`)
      if (!exercise) return addError('운동명이 비어있음')
      const parsed = parseSets(setsRaw)
      if (!parsed) return addError(`세트 형식 오류: "${setsRaw}" — 올바른 형식: 3x5x80`)
      const rpe = rpeStr && rpeStr !== '' ? parseFloat(rpeStr) : null
      if (rpe !== null && (isNaN(rpe) || rpe < 0 || rpe > 10)) {
        return addError(`RPE 범위 오류: "${rpeStr}" — 0~10 사이여야 함`)
      }
      const memo = memoParts.join('|').trim() || null
      records.push({
        type: 'GYM',
        date,
        exercise,
        sets: parsed.sets,
        reps: parsed.reps,
        weight: parsed.weight,
        volume: parsed.sets * parsed.reps * parsed.weight,
        rpe: rpe !== null ? rpe : null,
        memo: memo || null,
        raw: setsRaw,
      })
    } else if (category === 'DEL') {
      // DEL|category|date|id?
      if (fields.length < 3) return addError('필드 부족 — DEL|카테고리|날짜|id(선택)')
      const [, cat, date, id] = fields
      const catLower = cat?.toLowerCase()
      if (catLower !== 'run' && catLower !== 'gym') {
        return addError(`알 수 없는 카테고리: "${cat}" — run 또는 gym`)
      }
      if (!isValidDate(date)) return addError(`날짜 형식 오류: "${date}"`)
      records.push({
        type: 'DEL',
        category: catLower,
        date,
        id: id?.trim() || undefined,
      })
    } else {
      addError(`알 수 없는 카테고리: "${fields[0]}" — RUN, GYM, DEL 중 하나여야 함`)
    }
  })

  return { records, errors }
}
