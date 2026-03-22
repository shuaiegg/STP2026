import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const duplicates: any[] = await prisma.$queryRaw`
    SELECT "siteId", "keyword", COUNT(*)
    FROM "SiteKeyword"
    GROUP BY "siteId", "keyword"
    HAVING COUNT(*) > 1
  `;
  
  if (duplicates.length > 0) {
    console.log("Found duplicates:");
    console.log(JSON.stringify(duplicates, null, 2));
    
    // For each duplicate, we should keep one and delete others
    for (const dup of duplicates) {
      console.log(`Cleaning up: ${dup.keyword} for site ${dup.siteId}`);
      const allMatches = await prisma.siteKeyword.findMany({
        where: { siteId: dup.siteId, keyword: dup.keyword },
        select: { id: true },
        orderBy: { updatedAt: 'desc' }
      });
      
      const idsToDelete = allMatches.slice(1).map(m => m.id);
      await prisma.siteKeyword.deleteMany({
        where: { id: { in: idsToDelete } }
      });
    }
    console.log("Cleanup complete.");
  } else {
    console.log("No duplicates found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
