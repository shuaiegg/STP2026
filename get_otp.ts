import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const verifications = await prisma.verification.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  })
  console.log(JSON.stringify(verifications, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
