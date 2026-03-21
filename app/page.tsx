import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { MiniHeatmap } from '@/components/Heatmap'
import { formatDate, calcStreak, formatPace, formatKm } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const today = formatDate(new Date())
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))

  const [runs, gyms, todayRuns, todayGyms] = await Promise.all([
    prisma.run.findMany({
      where: { date: { gte: yearStart } },
      select: { date: true, km: true },
    }),
    prisma.gym.findMany({
      where: { date: { gte: yearStart } },
      select: { date: true, exercise: true, volume: true },
    }),
    prisma.run.findMany({
      where: { date: new Date(`${today}T00:00:00.000Z`) },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.gym.findMany({
      where: { date: new Date(`${today}T00:00:00.000Z`) },
      orderBy: { exercise: 'asc' },
    }),
  ])

  // 히트맵 데이터 (run: km 합산, gym: 종목 수)
  const runHeatmap: Record<string, number> = {}
  for (const r of runs) {
    const d = formatDate(r.date)
    runHeatmap[d] = (runHeatmap[d] ?? 0) + r.km
  }

  const gymHeatmap: Record<string, number> = {}
  for (const g of gyms) {
    const d = formatDate(g.date)
    if (!gymHeatmap[d]) gymHeatmap[d] = 0
    // 종목별로 중복 제거하기 위해 집합 사용은 SSR에서 간단히 카운트
    gymHeatmap[d] = gymHeatmap[d] + 1
  }
  // gym: 날짜별 유니크 종목 수로 재계산
  const gymByDate: Record<string, Set<string>> = {}
  for (const g of gyms) {
    const d = formatDate(g.date)
    if (!gymByDate[d]) gymByDate[d] = new Set()
    gymByDate[d].add(g.exercise)
  }
  const gymHeatmapFinal: Record<string, number> = {}
  for (const [d, set] of Object.entries(gymByDate)) {
    gymHeatmapFinal[d] = set.size
  }

  // 통계
  const runActiveDates = new Set(Object.keys(runHeatmap))
  const gymActiveDates = new Set(Object.keys(gymByDate))
  const totalKm = runs.reduce((s, r) => s + r.km, 0)
  const totalVolume = gyms.reduce((s, g) => s + (g.volume ?? 0), 0)

  return {
    runHeatmap,
    gymHeatmap: gymHeatmapFinal,
    runStats: {
      totalKm,
      activeDays: runActiveDates.size,
      streak: calcStreak(runActiveDates),
    },
    gymStats: {
      activeDays: gymActiveDates.size,
      streak: calcStreak(gymActiveDates),
      totalVolume,
    },
    todayRuns,
    todayGyms,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  const today = formatDate(new Date())

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-8">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-widest" style={{ color: 'var(--text)' }}>JO</h1>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{today}</span>
      </div>

      {/* 오늘 요약 */}
      {(data.todayRuns.length > 0 || data.todayGyms.length > 0) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] uppercase tracking-wider font-medium"
            style={{ color: 'var(--text-muted)' }}>오늘</h2>

          {data.todayRuns.map((r) => (
            <Link key={r.id} href="/run"
              className="rounded-lg p-4 flex items-center justify-between"
              style={{ background: 'var(--surface)', border: '1px solid var(--run-1)' }}>
              <div>
                <span className="text-xs font-bold" style={{ color: 'var(--run-3)' }}>RUN</span>
                <p className="text-lg font-bold tabular-nums mt-0.5" style={{ color: 'var(--text)' }}>
                  {r.km}km
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm tabular-nums" style={{ color: 'var(--text-dim)' }}>
                  {r.minutes}분
                </p>
                <p className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {formatPace(r.pace)}/km
                </p>
              </div>
            </Link>
          ))}

          {data.todayGyms.length > 0 && (
            <Link href="/gym"
              className="rounded-lg p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--gym-1)' }}>
              <span className="text-xs font-bold" style={{ color: 'var(--gym-3)' }}>GYM</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {[...new Set(data.todayGyms.map(g => g.exercise))].map((ex) => (
                  <span key={ex} className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--gym-1)', color: 'var(--gym-4)' }}>
                    {ex}
                  </span>
                ))}
              </div>
            </Link>
          )}
        </section>
      )}

      {/* RUN 섹션 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-wider font-medium"
            style={{ color: 'var(--text-muted)' }}>Run</h2>
          <Link href="/run" className="text-xs transition-colors"
            style={{ color: 'var(--run-3)' }}>전체 보기 →</Link>
        </div>
        <div className="rounded-lg p-4 flex flex-col gap-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <MiniHeatmap data={data.runHeatmap} category="run" />
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="총 거리" value={formatKm(Math.round(data.runStats.totalKm))} />
            <StatCard label="활동일" value={String(data.runStats.activeDays)} sub="일" />
            <StatCard label="연속" value={String(data.runStats.streak)} sub="일" />
          </div>
        </div>
      </section>

      {/* GYM 섹션 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-wider font-medium"
            style={{ color: 'var(--text-muted)' }}>Gym</h2>
          <Link href="/gym" className="text-xs transition-colors"
            style={{ color: 'var(--gym-3)' }}>전체 보기 →</Link>
        </div>
        <div className="rounded-lg p-4 flex flex-col gap-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <MiniHeatmap data={data.gymHeatmap} category="gym" />
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="총 볼륨"
              value={data.gymStats.totalVolume >= 1000
                ? `${(data.gymStats.totalVolume / 1000).toFixed(0)}t`
                : `${Math.round(data.gymStats.totalVolume)}kg`}
            />
            <StatCard label="활동일" value={String(data.gymStats.activeDays)} sub="일" />
            <StatCard label="연속" value={String(data.gymStats.streak)} sub="일" />
          </div>
        </div>
      </section>

    </div>
  )
}
