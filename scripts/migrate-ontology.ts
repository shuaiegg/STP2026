import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting ontology data migration...');

  const sites = await prisma.site.findMany({
    where: {
      businessOntology: {
        not: null,
      },
    },
  });

  console.log(`Found ${sites.length} sites with ontology data.`);

  for (const site of sites) {
    const ontology = site.businessOntology as any;
    console.log(`Migrating ontology for site: ${site.domain} (${site.id})`);

    try {
      // 1. Create SiteOntology
      const siteOntology = await prisma.siteOntology.create({
        data: {
          siteId: site.id,
          version: 1,
          coreOfferings: ontology.coreOfferings || [],
          targetAudience: ontology.targetAudience || [],
          painPointsSolved: ontology.painPointsSolved || [],
          idealTopicMap: ontology.idealTopicMap || [],
          // logicChains will be null as it's a new field
          createdAt: ontology.lastAnalyzedAt ? new Date(ontology.lastAnalyzedAt) : new Date(),
        },
      });

      console.log(`  ✅ Created SiteOntology: ${siteOntology.id}`);

      // 2. Create SemanticDebts
      if (ontology.semanticDebts && Array.isArray(ontology.semanticDebts)) {
        for (const debt of ontology.semanticDebts) {
          await prisma.semanticDebt.create({
            data: {
              siteId: site.id,
              ontologyId: siteOntology.id,
              topic: debt.topic,
              subtopics: debt.subtopics || [],
              relevance: debt.relevance || '',
              gscImpressions: debt.gscData?.impressions || 0,
              gscClicks: debt.gscData?.clicks || 0,
              priorityLabel: debt.priorityLabel || '',
              // coverageScore and proofDensity will be null as they are new fields
            },
          });
        }
        console.log(`  ✅ Migrated ${ontology.semanticDebts.length} semantic debts.`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to migrate site ${site.domain}:`, error);
    }
  }

  console.log('🏁 Migration complete.');
}

migrate()
  .catch((e) => {
    console.error('❌ Migration failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
