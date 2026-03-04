const KST_OFFSET_MS = 9 * 60 * 60 * 1000 // UTC+9

/** Get current time in KST as a Date object */
export function nowKST(): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + KST_OFFSET_MS)
}

/**
 * Get today's date for @db.Date columns.
 * PostgreSQL Date takes the UTC date part, so we return
 * a UTC midnight Date where the UTC date = KST date.
 * e.g. KST 2026-03-04 → returns 2026-03-04T00:00:00Z
 */
export function todayKST(): Date {
  const kst = nowKST()
  return new Date(Date.UTC(kst.getFullYear(), kst.getMonth(), kst.getDate()))
}

/** Tomorrow in same format as todayKST */
export function tomorrowKST(): Date {
  const kst = nowKST()
  return new Date(Date.UTC(kst.getFullYear(), kst.getMonth(), kst.getDate() + 1))
}

/** Get Monday of the current week in KST, for @db.Date */
export function getMondayKST(d?: Date): Date {
  const kst = d ? toKST(d) : nowKST()
  const day = kst.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return new Date(Date.UTC(kst.getFullYear(), kst.getMonth(), kst.getDate() + diff))
}

/** Convert a UTC/@db.Date value to KST Date (for display: getDay, getDate, etc.) */
export function toKST(d: Date | string): Date {
  const date = typeof d === 'string' ? new Date(d) : new Date(d.getTime())
  return new Date(date.getTime() + KST_OFFSET_MS)
}
