import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVerificationTable() {
  console.log('--- Inspecting Verification Table ---');
  try {
    const verifications = await prisma.verification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total records found (recent 10): ${verifications.length}`);
    console.table(verifications.map(v => ({
      id: v.id,
      identifier: v.identifier,
      expiresAt: v.expiresAt,
      createdAt: v.createdAt
    })));

    // Check for duplicates
    const counts = await prisma.verification.groupBy({
      by: ['identifier'],
      _count: {
        identifier: true
      }
    });
    
    const duplicates = counts.filter(c => c._count.identifier > 1);
    if (duplicates.length > 0) {
      console.log('\n🚨 DUPLICATES FOUND:');
      console.table(duplicates);
    } else {
      console.log('\n✅ No duplicates found in recent records.');
    }

  } catch (error) {
    console.error('Error accessing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVerificationTable();
