import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Deleting all workout logs...')

    // cascading will handle ExerciseSet, ExerciseLog, LiftSession, RunSession, SportSession
    const activities = await prisma.activity.deleteMany()
    const bodyLogs = await prisma.bodyLog.deleteMany()
    const races = await prisma.race.deleteMany()
    const fatigueOverrides = await prisma.fatigueOverride.deleteMany()

    console.log(`Deleted ${activities.count} activities (and their associated sessions/sets).`)
    console.log(`Deleted ${bodyLogs.count} body logs.`)
    console.log(`Deleted ${races.count} races.`)
    console.log(`Deleted ${fatigueOverrides.count} fatigue overrides.`)

    console.log('Finished deleting fake data! Kept Configurations and Exercises.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
