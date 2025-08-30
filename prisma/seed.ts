import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const achievements = [
    {
      name: 'Joined First Game',
      image: '',
    },
    {
      name: 'Won First Match',
      image: '',
    },
  ]

  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement,
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })