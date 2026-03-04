import { getRecommendation, getFatigueState, adjustFatigue } from './actions/fatigue'
import { getWeeklyStats } from './actions/activity'
import { startSession } from './actions/liftSession'
import { logRest } from './actions/activity'
import { getRecentBodyLogs, createBodyLog } from './actions/bodyLog'
import { getAllLiftConfigs } from './actions/liftConfig'
import Link from 'next/link'
import { FatigueBar } from './components/FatigueBar'
import { revalidatePath } from 'next/cache'

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
  const configMap = Object.fromEntries(configs.map((c) => [c.liftType, c]))

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">JORKOUT</h1>
        <Link href="/settings" className="text-white/40 text-lg">⚙️</Link>
      </div>

      {/* 피로도 */}
      <section className="space-y-2">
        <h2 className="text-sm text-white/60 font-medium">현재 피로도</h2>
        <FatigueBar fatigue={rec.fatigue} />
      </section>

      {/* 추천 */}
      <section className="space-y-3">
        <h2 className="text-sm text-white/60 font-medium">추천</h2>
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          {rec.primary.type === 'LIFT' && 'subType' in rec.primary ? (() => {
            const liftType = rec.primary.subType
            return (
            <>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏋️</span>
                <div>
                  <div className="font-bold text-lg">
                    {LIFT_NAMES[liftType]} Day
                  </div>
                  <div className="text-sm text-white/50">{rec.primary.reason}</div>
                </div>
              </div>
              {configMap[liftType] && (
                <div className="text-sm text-white/40">
                  TM {configMap[liftType].tm}kg · {configMap[liftType].weekLabel} week
                </div>
              )}
              <form action={async () => {
                'use server'
                await startSession(liftType as 'BENCH' | 'SQUAT' | 'OHP' | 'DEAD')
              }}>
                <button className="w-full bg-white text-black font-bold py-3 rounded-lg">
                  시작하기
                </button>
              </form>
            </>
            )
          })() : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-2xl">😴</span>
                <div>
                  <div className="font-bold text-lg">REST</div>
                  <div className="text-sm text-white/50">{rec.primary.reason}</div>
                </div>
              </div>
              <form action={logRest}>
                <button className="w-full bg-white/10 text-white font-bold py-3 rounded-lg">
                  휴식 기록
                </button>
              </form>
            </>
          )}
        </div>

        {/* 대안 */}
        <div className="flex gap-2">
          {rec.alternatives.map((alt, i) => (
            <div key={i} className="flex-1">
              {alt.type === 'RUN' ? (
                <Link href={`/run/log?type=${alt.subType}`}
                  className="block bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-lg">🏃</div>
                  <div className="text-xs text-white/60">{alt.subType} Run</div>
                </Link>
              ) : alt.type === 'SPORT' ? (
                <Link href="/sport/log"
                  className="block bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-lg">🎾</div>
                  <div className="text-xs text-white/60">Sport</div>
                </Link>
              ) : (
                <form action={logRest}>
                  <button className="w-full bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-lg">😴</div>
                    <div className="text-xs text-white/60">Rest</div>
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 이번 주 */}
      <section className="space-y-2">
        <h2 className="text-sm text-white/60 font-medium">이번 주</h2>
        <div className="bg-white/5 rounded-xl p-4 space-y-1">
          {weekly.activities.length === 0 ? (
            <p className="text-white/30 text-sm">아직 기록 없음</p>
          ) : (
            weekly.activities.map((act) => {
              const d = new Date(act.date)
              const dayName = DAY_NAMES[d.getDay()]
              let label: string = act.type
              if (act.liftSession) label = `${LIFT_NAMES[act.liftSession.liftType] || act.liftSession.liftType}`
              if (act.runSession) label = `${act.runSession.runType} Run`
              if (act.sportSession) label = act.sportSession.sportType as string
              return (
                <div key={act.id} className="flex items-center gap-2 text-sm">
                  <span className="text-white/30 w-6">{dayName}</span>
                  <span>{ACTIVITY_ICONS[act.type]}</span>
                  <span>{label}</span>
                </div>
              )
            })
          )}
          <div className="text-xs text-white/30 pt-2 border-t border-white/5">
            리프트 {weekly.liftCount}회 · 러닝 {weekly.runKm.toFixed(1)}km · 휴식 {weekly.restCount}일
          </div>
        </div>
      </section>

      {/* 체중 */}
      <section className="space-y-2">
        <h2 className="text-sm text-white/60 font-medium">체중 추적</h2>
        <div className="bg-white/5 rounded-xl p-4">
          {latestBody ? (
            <div className="text-lg font-bold">
              {latestBody.weight ?? '-'}kg
              {latestBody.bodyFat ? ` · 체지방 ${latestBody.bodyFat}%` : ''}
            </div>
          ) : (
            <div className="text-white/30 text-sm">기록 없음</div>
          )}
          <form action={async (formData: FormData) => {
            'use server'
            const weight = formData.get('weight') ? Number(formData.get('weight')) : null
            const bodyFat = formData.get('bodyFat') ? Number(formData.get('bodyFat')) : null
            await createBodyLog({ weight, bodyFat })
          }} className="flex gap-2 mt-2">
            <input name="weight" type="number" step="0.1" placeholder="체중(kg)"
              className="bg-white/10 rounded px-2 py-1 text-sm w-24" />
            <input name="bodyFat" type="number" step="0.1" placeholder="체지방(%)"
              className="bg-white/10 rounded px-2 py-1 text-sm w-24" />
            <button className="bg-white/10 rounded px-3 py-1 text-sm">기록</button>
          </form>
        </div>
      </section>
    </div>
  )
}
