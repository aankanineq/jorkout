// ============================================================
// 날짜 유틸
// ============================================================

/** Date 객체를 "YYYY-MM-DD" 문자열로 변환 (UTC 기준) */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** "YYYY-MM-DD" → Date (UTC 자정) */
export function parseDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`)
}

/** 오늘 날짜 "YYYY-MM-DD" (서버: UTC, 클라이언트에서 호출 시 로컬 기준 원하면 별도 처리) */
export function todayString(): string {
  return formatDate(new Date())
}

/** 연도의 모든 날짜 배열 "YYYY-MM-DD" 형식 */
export function getDaysOfYear(year: number): string[] {
  const days: string[] = []
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 11, 31))
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(formatDate(new Date(d)))
  }
  return days
}

/** 연속일수 계산 (날짜 집합 기준, 오늘 기준 역방향) */
export function calcStreak(activeDates: Set<string>): number {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    if (activeDates.has(formatDate(d))) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// ============================================================
// 페이스 계산
// ============================================================

/** 분/km → "M:SS" 형식 */
export function formatPace(pace: number | null): string {
  if (pace == null) return '–'
  const min = Math.floor(pace)
  const sec = Math.round((pace - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

/** 총 시간(분) → "Xh Ym" 형식 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ============================================================
// 히트맵 레벨 계산
// ============================================================

/** 러닝 km → 히트맵 레벨 0~4 */
export function runLevel(km: number): 0 | 1 | 2 | 3 | 4 {
  if (km <= 0) return 0
  if (km < 3) return 1
  if (km < 7) return 2
  if (km < 12) return 3
  return 4
}

/** 웨이트 종목 수 → 히트맵 레벨 0~4 */
export function gymLevel(exerciseCount: number): 0 | 1 | 2 | 3 | 4 {
  if (exerciseCount <= 0) return 0
  if (exerciseCount === 1) return 1
  if (exerciseCount === 2) return 2
  if (exerciseCount === 3) return 3
  return 4
}

// ============================================================
// 숫자 포맷
// ============================================================

export function formatKm(km: number): string {
  return km % 1 === 0 ? `${km}km` : `${km.toFixed(1)}km`
}

export function formatVolume(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}t`
  return `${vol}kg`
}
