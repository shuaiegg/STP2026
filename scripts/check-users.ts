import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { transactions: true, sessions: true, executions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || '未命名'} (${user.email})`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Credits: ${user.credits}`);
      console.log(`   - Executions: ${user._count.executions}`);
      console.log(`   - Transactions: ${user._count.transactions}`);
      console.log(`   - Sessions: ${user._count.sessions}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log('');
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
