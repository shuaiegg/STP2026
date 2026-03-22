import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const audits = await prisma.siteAudit.findMany({
    where: { pageCount: null },
    select: { id: true, report: true }
  });

  console.log(`Migrating ${audits.length} audits...`);

  for (const audit of audits) {
    const report = audit.report as any;
    // Backward compatibility: if it doesn't have graphData key, the whole report IS the graphData
    const graphData = report?.graphData ? report.graphData : report;
    const pageCount = graphData?.nodes?.length ?? 0;

    await prisma.siteAudit.update({
      where: { id: audit.id },
      data: { pageCount }
    });
  }

  console.log("Migration complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
