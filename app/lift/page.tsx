import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { startSession } from '@/app/actions/liftSession'

const MODULE_LABEL: Record<string, string> = {
  SQ: '스쿼트',
  HN: '힙힌지',
  PU: '수평푸시',
  VU: '수직푸시',
  PL: '수직풀',
  RL: '수평풀',
}

export default async function LiftPage() {
  const cycle = await prisma.liftCycle.findFirst({
    where: { status: 'ACTIVE' },
    include: {
      splits: {
        orderBy: { order: 'asc' },
        include: {
          modules: { orderBy: { order: 'asc' } },
          _count: { select: { sessions: true } },
        },
      },
      _count: { select: { sessions: true } },
    },
  })

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">리프팅</h1>
          <Link
            href="/lift/cycle/new"
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            새 사이클
          </Link>
        </div>

        {cycle ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-zinc-900">
                사이클 #{cycle.number}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                {cycle.splitCount}분할
              </span>
              <span className="text-xs text-zinc-400">
                총 {cycle._count.sessions}회 세션
              </span>
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cycle.splitCount}, 1fr)` }}>
              {cycle.splits.map((split) => (
                <form key={split.id} action={startSession.bind(null, split.id)}>
                  <button
                    type="submit"
                    className="w-full text-left rounded-xl bg-zinc-50 px-4 py-4 border border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-zinc-900">Split {split.dayLabel}</span>
                      <span className="text-xs text-zinc-400">{split._count.sessions}회</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {split.modules.map((mod) => (
                        <span
                          key={mod.id}
                          className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium"
                        >
                          {MODULE_LABEL[mod.moduleCode]}
                        </span>
                      ))}
                    </div>
                  </button>
                </form>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-6 py-12 text-center space-y-3">
            <p className="text-zinc-500">활성 사이클이 없습니다</p>
            <Link
              href="/lift/cycle/new"
              className="inline-block text-sm px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              사이클 만들기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
