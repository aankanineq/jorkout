'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

type SplitInput = {
  dayLabel: string
  modules: string[]
}

export async function createCycle(splitCount: number, splits: SplitInput[]) {
  // 기존 ACTIVE 사이클 완료 처리
  await prisma.liftCycle.updateMany({
    where: { status: 'ACTIVE' },
    data: { status: 'COMPLETED', endDate: new Date() },
  })

  // 다음 사이클 번호
  const lastCycle = await prisma.liftCycle.findFirst({
    orderBy: { number: 'desc' },
  })
  const nextNumber = (lastCycle?.number ?? 0) + 1

  // LiftCycle + SplitDay + SplitModule 생성
  await prisma.liftCycle.create({
    data: {
      number: nextNumber,
      splitCount,
      startDate: new Date(),
      splits: {
        create: splits.map((split, i) => ({
          dayLabel: split.dayLabel,
          order: i,
          modules: {
            create: split.modules.map((mod, j) => ({
              moduleCode: mod as any,
              order: j,
            })),
          },
        })),
      },
    },
  })

  redirect('/lift')
}
