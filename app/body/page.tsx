import { getRecentBodyLogs, createBodyLog } from '@/app/actions/bodyLog'

export default async function BodyPage() {
  const bodyLogs = await getRecentBodyLogs(90)
  const latest = bodyLogs[0]

  return (
    <div className="p-5 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">체중</h1>

      {/* 최근 측정 + 입력 */}
      <section className="bg-card border border-border shadow-sm rounded-2xl p-5 space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">최근 측정</div>
          {latest ? (
            <div className="text-2xl font-bold tracking-tight">
              {latest.weight ?? '-'} <span className="text-base font-normal text-muted-foreground">kg</span>
              {latest.bodyFat && (
                <span className="text-base font-normal text-muted-foreground ml-2">
                  · {latest.bodyFat}%
                </span>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">기록 없음</div>
          )}
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
      </section>

      {/* 체중 추이 */}
      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">기록</h2>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          {bodyLogs.length === 0 ? (
            <p className="text-muted-foreground/60 text-sm">아직 기록 없음</p>
          ) : (
            bodyLogs.map((log) => {
              const d = new Date(log.date)
              return (
                <div key={log.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground/80">{d.getMonth() + 1}/{d.getDate()}</span>
                  <span className="font-mono">
                    {log.weight ?? '-'}kg
                    {log.bodyFat ? ` · ${log.bodyFat}%` : ''}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
