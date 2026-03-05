import { getRecommendation } from './actions/fatigue'
import { getWeeklyStats, getTodayActivities } from './actions/activity'
import { startSession, autoCompleteStaleSessions } from './actions/liftSession'
import { logRest } from './actions/activity'
import { getAllLiftConfigs } from './actions/liftConfig'
import Link from 'next/link'
import { FatigueBar } from './components/FatigueBar'
import { toKST } from '@/lib/date'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const ACTIVITY_LABELS: Record<string, string> = {
  LIFT: 'LIFT', RUN: 'RUN', SPORT: 'SPORT', REST: 'REST',
}
const LIFT_NAMES: Record<string, string> = {
  BENCH: 'Bench', SQUAT: 'Squat', OHP: 'OHP', DEAD: 'Dead',
}

function activityColor(type: string) {
  const key = type.toLowerCase()
  return {
    bg: `var(--color-${key}-muted)`,
    border: `var(--color-${key}-border)`,
    dot: `var(--color-${key})`,
  }
}

export default async function Dashboard() {
  // 전날 이전 미완료 세션 자동 완료
  await autoCompleteStaleSessions()

  const [rec, weekly, configs, todayActs] = await Promise.all([
    getRecommendation(),
    getWeeklyStats(),
    getAllLiftConfigs(),
    getTodayActivities(),
  ])

  const configMap = Object.fromEntries(configs.map((c: { liftType: string, tm: number, weekLabel: string }) => [c.liftType, c]))
  // 진행중인 리프트 세션 찾기
  const inProgressAct = todayActs.find((act: { type: string, liftSession?: { completed: boolean } | null }) =>
    act.type === 'LIFT' && act.liftSession && !act.liftSession.completed
  ) as { id: string, liftSession: { id: string, liftType: string, completed: boolean } } | undefined
  // 완료된 활동만 카운트
  const completedActs = todayActs.filter((act: { type: string, liftSession?: { completed: boolean } | null }) =>
    act.type !== 'LIFT' || (act.liftSession && act.liftSession.completed)
  )
  const todayDone = completedActs.length > 0

  return (
    <div className="p-5 max-w-lg mx-auto space-y-10">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-border mt-2">
        <h1 className="text-xl font-bold tracking-tight">JORKOUT</h1>
        <div className="flex items-center gap-4">
          <form action={async () => {
            'use server'
            const { revalidatePath } = await import('next/cache')
            revalidatePath('/', 'layout')
          }}>
            <button type="submit" className="text-muted-foreground hover:text-foreground transition-colors flex items-center mt-1.5" title="DB 동기화">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
          </form>
          <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
          </Link>
        </div>
      </header>

      {/* 피로도 */}
      <section>
        <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">현재 피로도</h2>
        <FatigueBar fatigue={rec.fatigue} />
      </section>

      {/* 추천 / 진행중 / 완료 */}
      <section>
        <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
          {inProgressAct ? '진행중' : todayDone ? '오늘의 운동' : '오늘의 추천'}
        </h2>

        {inProgressAct ? (() => {
          const c = activityColor('LIFT')
          return (
            <Link href={`/session/${inProgressAct.liftSession.id}`}
              className="block shadow-sm rounded-2xl p-5"
              style={{ background: c.bg, borderWidth: 1, borderStyle: 'solid', borderColor: c.border }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.dot }} />
                <span className="font-semibold">{LIFT_NAMES[inProgressAct.liftSession.liftType]} Day</span>
                <span className="ml-auto text-xs text-muted-foreground">이어서 하기 →</span>
              </div>
            </Link>
          )
        })() : todayDone ? (
          <>
            {/* 완료 카드 */}
            <div className="space-y-2 mb-4">
              {completedActs.map((act: { id: string, type: string, liftSession?: { liftType: string } | null, runSession?: { runType: string } | null, sportSession?: { sportType: string } | null }) => {
                const c = activityColor(act.type)
                let label = act.type
                if (act.liftSession) label = `${LIFT_NAMES[act.liftSession.liftType] || act.liftSession.liftType} Day`
                if (act.runSession) label = `${act.runSession.runType} Run`
                if (act.sportSession) label = act.sportSession.sportType
                return (
                  <div key={act.id} className="shadow-sm rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: c.bg, borderWidth: 1, borderStyle: 'solid', borderColor: c.border }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                    <span className="text-xs font-bold tracking-wide" style={{ color: c.dot }}>{ACTIVITY_LABELS[act.type]}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                )
              })}
            </div>

            {/* 추가 운동 */}
            <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">추가 운동</div>
          </>
        ) : (
          (() => {
            const primaryType = rec.primary.type === 'LIFT' && 'subType' in rec.primary ? 'LIFT' : 'REST'
            const c = activityColor(primaryType)
            return (
              <div className="shadow-sm rounded-2xl p-5 mb-4"
                style={{ background: c.bg, borderWidth: 1, borderStyle: 'solid', borderColor: c.border }}>
                {rec.primary.type === 'LIFT' && 'subType' in rec.primary ? (() => {
                  const liftType = rec.primary.subType
                  return (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-bold text-xl tracking-tight">
                          {LIFT_NAMES[liftType]} Day
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{rec.primary.reason}</p>
                      </div>

                      {configMap[liftType] && (
                        <div className="bg-background/50 border border-border/50 rounded-xl p-3 flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Target Weight</span>
                          <span className="font-mono font-medium">{configMap[liftType].tm} kg</span>
                          <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-md text-xs">{configMap[liftType].weekLabel} week</span>
                        </div>
                      )}

                      <form action={async () => {
                        'use server'
                        await startSession(liftType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD')
                      }}>
                        <button className="w-full text-white font-medium py-3.5 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-sm"
                          style={{ background: c.dot }}>
                          운동 시작하기
                        </button>
                      </form>
                    </div>
                  )
                })() : (
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-bold text-xl tracking-tight">Rest Day</h3>
                      <p className="text-sm text-muted-foreground mt-1">{rec.primary.reason}</p>
                    </div>
                    <form action={async () => { 'use server'; await logRest() }}>
                      <button className="w-full bg-muted text-foreground border border-border font-medium py-3.5 rounded-xl hover:bg-muted/80 transition-all active:scale-[0.98]">
                        휴식 기록하기
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })()
        )}

        {/* 대안 */}
        {!inProgressAct && <div className="grid grid-cols-3 gap-3">
          {rec.alternatives.filter((alt: { type: string }) => {
            if (!todayDone) return true
            if (alt.type === 'REST') return false
            const doneTypes = new Set(completedActs.map((a: { type: string }) => a.type))
            return !doneTypes.has(alt.type)
          }).map((alt: { type: string; subType?: string }, i: number) => {
            const c = activityColor(alt.type)
            const cardStyle = { background: c.bg, borderWidth: 1, borderStyle: 'solid' as const, borderColor: c.border }
            return (
              <div key={i}>
                {alt.type === 'LIFT' ? (
                  <form action={async () => {
                    'use server'
                    await startSession(alt.subType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD')
                  }} className="h-full">
                    <button className="w-full h-full flex flex-col items-center justify-center rounded-xl p-4 hover:opacity-80 transition-opacity"
                      style={cardStyle}>
                      <span className="text-xs font-bold tracking-wide mb-1" style={{ color: c.dot }}>LIFT</span>
                      <span className="text-xs text-muted-foreground">{LIFT_NAMES[alt.subType!] || alt.subType}</span>
                    </button>
                  </form>
                ) : alt.type === 'RUN' ? (
                  <Link href={`/run/log?type=${alt.subType}`}
                    className="flex flex-col items-center justify-center h-full rounded-xl p-4 hover:opacity-80 transition-opacity"
                    style={cardStyle}>
                    <span className="text-xs font-bold tracking-wide mb-1" style={{ color: c.dot }}>RUN</span>
                    <span className="text-xs text-muted-foreground">{alt.subType}</span>
                  </Link>
                ) : alt.type === 'SPORT' ? (
                  <Link href="/sport/log"
                    className="flex flex-col items-center justify-center h-full rounded-xl p-4 hover:opacity-80 transition-opacity"
                    style={cardStyle}>
                    <span className="text-xs font-bold tracking-wide" style={{ color: c.dot }}>SPORT</span>
                  </Link>
                ) : (
                  <form action={async () => { 'use server'; await logRest() }} className="h-full">
                    <button className="w-full h-full flex flex-col items-center justify-center rounded-xl p-4 hover:opacity-80 transition-opacity"
                      style={cardStyle}>
                      <span className="text-xs font-bold tracking-wide" style={{ color: c.dot }}>REST</span>
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>}
      </section>

      {/* 이번 주 */}
      <section>
        <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">이번 주 기록</h2>
        <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
          {weekly.activities.length === 0 ? (
            <div className="p-5 text-center text-muted-foreground text-sm">아직 기록 없음</div>
          ) : (
            <div className="divide-y divide-border">
              {weekly.activities.map((act) => {
                const d = toKST(act.date)
                const dayName = DAY_NAMES[d.getDay()]
                let label: string = act.type
                if (act.liftSession) label = `${LIFT_NAMES[act.liftSession.liftType] || act.liftSession.liftType}`
                if (act.runSession) label = `${act.runSession.runType} Run`
                if (act.sportSession) label = act.sportSession.sportType as string

                const c = activityColor(act.type)
                return (
                  <div key={act.id} className="flex items-center gap-4 py-3 px-5 hover:bg-muted/50 transition-colors">
                    <span className="text-muted-foreground text-sm font-medium w-6">{dayName}</span>
                    <div className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                    <span className="text-xs font-bold tracking-wide w-10" style={{ color: c.dot }}>{ACTIVITY_LABELS[act.type]}</span>
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

    </div>
  )
}
