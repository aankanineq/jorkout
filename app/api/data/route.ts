import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseProtocol } from '@/lib/parser'
import { formatDate } from '@/lib/utils'

// ============================================================
// GET /api/data
// ============================================================
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category') ?? 'all'
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const year = searchParams.get('year')

  // 날짜 범위 필터 빌드
  function buildDateFilter() {
    const filter: { gte?: Date; lte?: Date } = {}
    if (year) {
      const y = parseInt(year)
      filter.gte = new Date(Date.UTC(y, 0, 1))
      filter.lte = new Date(Date.UTC(y, 11, 31))
    }
    if (from) filter.gte = new Date(`${from}T00:00:00.000Z`)
    if (to) filter.lte = new Date(`${to}T23:59:59.999Z`)
    return Object.keys(filter).length > 0 ? filter : undefined
  }

  const dateFilter = buildDateFilter()

  try {
    const [runs, gyms] = await Promise.all([
      category === 'gym' ? [] : prisma.run.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: { date: 'desc' },
      }),
      category === 'run' ? [] : prisma.gym.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        orderBy: [{ date: 'desc' }, { createdAt: 'asc' }],
      }),
    ])

    // summary 계산
    const runActiveDates = new Set(runs.map(r => formatDate(r.date)))
    const gymActiveDates = new Set(gyms.map(g => formatDate(g.date)))

    const summary = {
      run: {
        totalKm: runs.reduce((s, r) => s + r.km, 0),
        totalMin: runs.reduce((s, r) => s + r.minutes, 0),
        activeDays: runActiveDates.size,
      },
      gym: {
        totalExercises: new Set(gyms.map(g => g.exercise)).size,
        totalVolume: gyms.reduce((s, g) => s + (g.volume ?? 0), 0),
        activeDays: gymActiveDates.size,
      },
    }

    return NextResponse.json({
      run: runs.map(r => ({ ...r, date: formatDate(r.date) })),
      gym: gyms.map(g => ({ ...g, date: formatDate(g.date) })),
      summary,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 })
  }
}

// ============================================================
// POST /api/data  — 프로토콜 파싱 → 저장
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { protocol } = body as { protocol: string }

    if (!protocol || typeof protocol !== 'string') {
      return NextResponse.json({ error: 'protocol 필드가 필요합니다.' }, { status: 400 })
    }

    const { records, errors } = parseProtocol(protocol)

    const added: { type: string; date: string; id: string }[] = []
    const writeErrors: { reason: string }[] = errors.map(e => ({ reason: `L${e.line}: ${e.reason}` }))

    for (const record of records) {
      try {
        if (record.type === 'RUN') {
          const run = await prisma.run.create({
            data: {
              date: new Date(`${record.date}T00:00:00.000Z`),
              km: record.km,
              minutes: record.minutes,
              pace: record.pace,
            },
          })
          added.push({ type: 'run', date: record.date, id: run.id })
        } else if (record.type === 'GYM') {
          const gym = await prisma.gym.create({
            data: {
              date: new Date(`${record.date}T00:00:00.000Z`),
              exercise: record.exercise,
              sets: record.sets,
              reps: record.reps,
              weight: record.weight,
              volume: record.volume,
              rpe: record.rpe,
              memo: record.memo,
              raw: record.raw,
            },
          })
          added.push({ type: 'gym', date: record.date, id: gym.id })
        } else if (record.type === 'DEL') {
          if (record.id) {
            // 개별 삭제
            if (record.category === 'run') {
              await prisma.run.delete({ where: { id: record.id } })
            } else {
              await prisma.gym.delete({ where: { id: record.id } })
            }
          } else {
            // 날짜 전체 삭제
            const dateVal = new Date(`${record.date}T00:00:00.000Z`)
            if (record.category === 'run') {
              await prisma.run.deleteMany({ where: { date: dateVal } })
            } else {
              await prisma.gym.deleteMany({ where: { date: dateVal } })
            }
          }
        }
      } catch (e) {
        writeErrors.push({ reason: `저장 실패 (${record.type} ${record.date}): ${String(e)}` })
      }
    }

    return NextResponse.json({ added: added.length, records: added, errors: writeErrors })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}

// ============================================================
// DELETE /api/data  — 개별 삭제 또는 전체 초기화
// ============================================================
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, id } = body as { category: string; id?: string }

    if (category === 'all') {
      await Promise.all([
        prisma.run.deleteMany(),
        prisma.gym.deleteMany(),
      ])
      return NextResponse.json({ deleted: 'all' })
    }

    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
    }

    if (category === 'run') {
      await prisma.run.delete({ where: { id } })
    } else if (category === 'gym') {
      await prisma.gym.delete({ where: { id } })
    } else {
      return NextResponse.json({ error: '알 수 없는 category' }, { status: 400 })
    }

    return NextResponse.json({ deleted: id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }
}

// ============================================================
// PATCH /api/data  — 개별 레코드 수정
// ============================================================
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, id, updates } = body as {
      category: string
      id: string
      updates: Record<string, unknown>
    }

    if (!id || !updates) {
      return NextResponse.json({ error: 'id와 updates가 필요합니다.' }, { status: 400 })
    }

    if (category === 'run') {
      const { km, minutes } = updates as { km?: number; minutes?: number }
      const data: Record<string, unknown> = {}
      if (km !== undefined) { data.km = km; data.pace = minutes !== undefined ? minutes / km : undefined }
      if (minutes !== undefined) data.minutes = minutes
      const run = await prisma.run.update({ where: { id }, data })
      return NextResponse.json({ updated: { ...run, date: formatDate(run.date) } })
    } else if (category === 'gym') {
      const { sets, reps, weight, rpe, memo } = updates as {
        sets?: number; reps?: number; weight?: number; rpe?: number | null; memo?: string | null
      }
      const data: Record<string, unknown> = {}
      if (sets !== undefined) data.sets = sets
      if (reps !== undefined) data.reps = reps
      if (weight !== undefined) data.weight = weight
      if (rpe !== undefined) data.rpe = rpe
      if (memo !== undefined) data.memo = memo

      // raw, volume 재계산
      const current = await prisma.gym.findUniqueOrThrow({ where: { id } })
      const newSets = (sets ?? current.sets)
      const newReps = (reps ?? current.reps)
      const newWeight = (weight ?? current.weight)
      data.raw = `${newSets}x${newReps}x${newWeight}`
      data.volume = newSets * newReps * newWeight

      const gym = await prisma.gym.update({ where: { id }, data })
      return NextResponse.json({ updated: { ...gym, date: formatDate(gym.date) } })
    }

    return NextResponse.json({ error: '알 수 없는 category' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '수정 실패' }, { status: 500 })
  }
}
