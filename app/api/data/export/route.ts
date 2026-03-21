import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export async function GET() {
  try {
    const [runs, gyms] = await Promise.all([
      prisma.run.findMany({ orderBy: { date: 'asc' } }),
      prisma.gym.findMany({ orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] }),
    ])

    const data = {
      exportedAt: new Date().toISOString(),
      run: runs.map(r => ({
        id: r.id,
        date: formatDate(r.date),
        km: r.km,
        minutes: r.minutes,
        pace: r.pace,
      })),
      gym: gyms.map(g => ({
        id: g.id,
        date: formatDate(g.date),
        exercise: g.exercise,
        sets: g.sets,
        reps: g.reps,
        weight: g.weight,
        volume: g.volume,
        rpe: g.rpe,
        memo: g.memo,
        raw: g.raw,
      })),
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="jo-data-${formatDate(new Date())}.json"`,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '내보내기 실패' }, { status: 500 })
  }
}
