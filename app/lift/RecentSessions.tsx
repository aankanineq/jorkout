'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteSession } from '@/app/actions/liftSession'

const SPLIT_LABEL: Record<string, string> = {
  PUSH: '푸시',
  PULL: '풀',
  LEG: '레그',
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(date))
}

type SetInfo = { id: string; weight: number; reps: number }
type LogInfo = {
  id: string
  exercise: { name: string; role: string }
  sets: SetInfo[]
}
type SessionInfo = {
  id: string
  date: string
  splitType: string
  duration: number | null
  exerciseLogs: LogInfo[]
}

export default function RecentSessions({ sessions }: { sessions: SessionInfo[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent, sessionId: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('이 세션을 삭제하시겠습니까?')) return
    startTransition(async () => {
      await deleteSession(sessionId)
      router.refresh()
    })
  }

  if (sessions.length === 0) return null

  // Group sessions by split type
  const pushSessions = sessions.filter(s => s.splitType === 'PUSH')
  const pullSessions = sessions.filter(s => s.splitType === 'PULL')
  const legSessions = sessions.filter(s => s.splitType === 'LEG')

  const renderSessionGroup = (title: string, groupSessions: SessionInfo[]) => {
    if (groupSessions.length === 0) return null;
    return (
      <div className="pt-2">
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">{title}</h3>
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {groupSessions.map((session) => (
            <Link
              key={session.id}
              href={`/lift/session/${session.id}`}
              className="block shrink-0 w-[280px] rounded-xl bg-zinc-50 px-5 py-4 hover:bg-zinc-100 transition-colors group snap-start border border-zinc-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-700">{formatDate(session.date)}</span>
                <div className="flex items-center gap-2">
                  {session.duration && (
                    <span className="text-xs text-zinc-400">{session.duration}분</span>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    disabled={isPending}
                    className="text-xs text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {session.exerciseLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {log.exercise.role === 'MAIN' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      )}
                      <span className="text-zinc-600">{log.exercise.name}</span>
                    </div>
                    <div className="flex gap-1 text-xs text-zinc-500">
                      {log.sets.map((set) => (
                        <span key={set.id} className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                          {set.weight}×{set.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">최근 세션</h2>
        <Link href="/lift/history" className="text-xs text-indigo-600 hover:text-indigo-500">프로그레션 →</Link>
      </div>

      <div className="space-y-6 divide-y divide-zinc-100">
        {renderSessionGroup('푸시 (PUSH)', pushSessions)}
        {renderSessionGroup('풀 (PULL)', pullSessions)}
        {renderSessionGroup('레그 (LEG)', legSessions)}
      </div>
    </div>
  )
}
