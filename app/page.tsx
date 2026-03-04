import { getRecommendation } from './actions/fatigue'
import { getWeeklyStats } from './actions/activity'
import { startSession } from './actions/liftSession'
import { logRest } from './actions/activity'
import { getRecentBodyLogs, createBodyLog } from './actions/bodyLog'
import { getAllLiftConfigs } from './actions/liftConfig'
import Link from 'next/link'
import { FatigueBar } from './components/FatigueBar'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const ACTIVITY_ICONS: Record<string, string> = {
  LIFT: '🏋️', RUN: '🏃', SPORT: '🎾', REST: '😴',
}
const LIFT_NAMES: Record<string, string> = {
  BENCH: 'Bench', SQUAT: 'Squat', OHP: 'OHP', DEAD: 'Dead',
}

export default async function Dashboard() {
  const [rec, weekly, bodyLogs, configs] = await Promise.all([
    getRecommendation(),
    getWeeklyStats(),
    getRecentBodyLogs(7),
    getAllLiftConfigs(),
  ])

  const latestBody = bodyLogs[0]
  const configMap = Object.fromEntries(configs.map((c: { liftType: string, tm: number, weekLabel: string }) => [c.liftType, c]))

  return (
    <div className="p-5 max-w-lg mx-auto space-y-10">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-border mt-2">
        <h1 className="text-xl font-bold tracking-tight">JORKOUT</h1>
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
        </Link>
      </header>

      {/* 피로도 */}
      <section>
        <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">현재 피로도</h2>
        <FatigueBar fatigue={rec.fatigue} />
      </section>

      {/* 추천 */}
      <section>
        <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">오늘의 추천</h2>

        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 mb-4">
          {rec.primary.type === 'LIFT' && 'subType' in rec.primary ? (() => {
            const liftType = rec.primary.subType
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-2xl">
                    🏋️
                  </div>
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">
                      {LIFT_NAMES[liftType]} Day
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{rec.primary.reason}</p>
                  </div>
                </div>

                {configMap[liftType] && (
                  <div className="bg-background border border-border rounded-xl p-3 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Target Weight</span>
                    <span className="font-mono font-medium">{configMap[liftType].tm} kg</span>
                    <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-md text-xs">{configMap[liftType].weekLabel} week</span>
                  </div>
                )}

                <form action={async () => {
                  'use server'
                  await startSession(liftType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD')
                }}>
                  <button className="w-full bg-foreground text-background font-medium py-3.5 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-sm">
                    운동 시작하기
                  </button>
                </form>
              </div>
            )
          })() : (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-2xl">
                  😴
                </div>
                <div>
                  <h3 className="font-bold text-xl tracking-tight">Rest Day</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{rec.primary.reason}</p>
                </div>
              </div>
              <form action={logRest}>
                <button className="w-full bg-muted text-foreground border border-border font-medium py-3.5 rounded-xl hover:bg-muted/80 transition-all active:scale-[0.98]">
                  휴식 기록하기
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 대안 */}
        <div className="grid grid-cols-3 gap-3">
          {rec.alternatives.map((alt: { type: string; subType?: string }, i: number) => (
            <div key={i}>
              {alt.type === 'RUN' ? (
                <Link href={`/run/log?type=${alt.subType}`}
                  className="flex flex-col items-center justify-center h-full bg-card border border-border rounded-xl p-4 hover:bg-muted transition-colors">
                  <span className="text-2xl mb-2">🏃</span>
                  <span className="text-xs font-medium text-muted-foreground">{alt.subType} Run</span>
                </Link>
              ) : alt.type === 'SPORT' ? (
                <Link href="/sport/log"
                  className="flex flex-col items-center justify-center h-full bg-card border border-border rounded-xl p-4 hover:bg-muted transition-colors">
                  <span className="text-2xl mb-2">🎾</span>
                  <span className="text-xs font-medium text-muted-foreground">Sport</span>
                </Link>
              ) : (
                <form action={logRest} className="h-full">
                  <button className="w-full h-full flex flex-col items-center justify-center bg-card border border-border rounded-xl p-4 hover:bg-muted transition-colors">
                    <span className="text-2xl mb-2">😴</span>
                    <span className="text-xs font-medium text-muted-foreground">Rest</span>
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 이번 주 */}
      <section>
        <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">이번 주 기록</h2>
        <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
          {weekly.activities.length === 0 ? (
            <div className="p-5 text-center text-muted-foreground text-sm">아직 기록 없음</div>
          ) : (
            <div className="divide-y divide-border">
              {weekly.activities.map((act: any) => {
                const d = new Date(act.date)
                const dayName = DAY_NAMES[d.getDay()]
                let label: string = act.type
                if (act.liftSession) label = `${LIFT_NAMES[act.liftSession.liftType] || act.liftSession.liftType}`
                if (act.runSession) label = `${act.runSession.runType} Run`
                if (act.sportSession) label = act.sportSession.sportType as string

                return (
                  <div key={act.id} className="flex items-center gap-4 py-3 px-5 hover:bg-muted/50 transition-colors">
                    <span className="text-muted-foreground text-sm font-medium w-6">{dayName}</span>
                    <span className="text-lg">{ACTIVITY_ICONS[act.type]}</span>
                    <span className="font-medium text-sm flex-1">{label}</span>
                  </div>
                )
              })}
            </div>
          )}
          <div className="bg-muted/50 px-5 py-3 text-xs text-muted-foreground font-medium flex justify-between">
            <span>리프트 {weekly.liftCount}회</span>
            <span>러닝 {weekly.runKm.toFixed(1)}km</span>
            <span>휴식 {weekly.restCount}일</span>
          </div>
        </div>
      </section>

      {/* 체중 */}
      <section>
        <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">체중 기록</h2>
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">최근 측정</div>
              {latestBody ? (
                <div className="text-2xl font-bold tracking-tight">
                  {latestBody.weight ?? '-'} <span className="text-base font-normal text-muted-foreground">kg</span>
                  {latestBody.bodyFat && (
                    <span className="text-base font-normal text-muted-foreground ml-2">
                      · {latestBody.bodyFat}%
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">기록 없음</div>
              )}
            </div>
          </div>

          <form action={async (formData: FormData) => {
            'use server'
            const weight = formData.get('weight') ? Number(formData.get('weight')) : null
            const bodyFat = formData.get('bodyFat') ? Number(formData.get('bodyFat')) : null
            await createBodyLog({ weight, bodyFat })
          }} className="flex gap-2">
            <input name="weight" type="number" step="0.1" placeholder="체중(kg)"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow" />
            <input name="bodyFat" type="number" step="0.1" placeholder="체지방(%)"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow" />
            <button className="bg-foreground text-background font-medium rounded-lg px-4 py-2 text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
              저장
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
