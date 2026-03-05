import { getRecentBodyLogs, createBodyLog } from '@/app/actions/bodyLog'
import { BodyChart } from './BodyChart'

export default async function BodyPage() {
  const bodyLogs = await getRecentBodyLogs(180)
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0]

  const chartLogs = bodyLogs.map(l => ({
    id: l.id,
    date: new Date(l.date).toISOString(),
    weight: l.weight,
    bodyFat: l.bodyFat,
    muscleMass: l.muscleMass,
  }))

  return (
    <div className="p-5 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">체중</h1>

      {/* 입력 */}
      <section className="bg-card border border-border shadow-sm rounded-2xl p-5">
        <form action={async (formData: FormData) => {
          'use server'
          const date = formData.get('date') as string || null
          const weight = formData.get('weight') ? Number(formData.get('weight')) : null
          const bodyFat = formData.get('bodyFat') ? Number(formData.get('bodyFat')) : null
          const muscleMass = formData.get('muscleMass') ? Number(formData.get('muscleMass')) : null
          await createBodyLog({ date, weight, bodyFat, muscleMass })
        }} className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground w-16 shrink-0">날짜</label>
            <input name="date" type="date" defaultValue={today}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground w-16 shrink-0">체중</label>
            <div className="flex-1 relative">
              <input name="weight" type="number" step="0.1" placeholder="0.0"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground w-16 shrink-0">근육량</label>
            <div className="flex-1 relative">
              <input name="muscleMass" type="number" step="0.1" placeholder="0.0"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground w-16 shrink-0">체지방</label>
            <div className="flex-1 relative">
              <input name="bodyFat" type="number" step="0.1" placeholder="0.0"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <button className="w-full bg-foreground text-background font-medium rounded-lg px-4 py-2.5 text-sm hover:opacity-90 transition-opacity">
            저장
          </button>
        </form>
      </section>

      {/* 그래프 */}
      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">추이</h2>
        <div className="bg-card border border-border rounded-xl p-4">
          <BodyChart logs={chartLogs} />
        </div>
      </section>
    </div>
  )
}
