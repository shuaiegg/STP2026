
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLatestContent() {
    try {
        const lastExecution = await prisma.skillExecution.findFirst({
            where: {
                skillName: 'stellar-writer'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!lastExecution) {
            console.log('No completed stellar-writer executions found.');
            return;
        }

        console.log(`\n📅 Execution Time: ${lastExecution.createdAt.toLocaleString()}`);
        console.log(`⌨️  Input Keywords: ${(lastExecution.input as any).keywords}`);

        const output = lastExecution.output as any;

        if (!output || !output.data) {
            console.log('No output data found.');
            return;
        }

        const data = output.data;
        const content = data.content || '';

        console.log(`\n📝 Generated Content Length: ${content.length} chars`);

        // Extract H2/H3 headings
        const headings = content.match(/^#{2,3}\s+(.+)$/gm) || [];
        console.log('\n📌 Headings Found:');
        headings.forEach((h: string) => console.log(`   ${h}`));

        // Check for PAA-like patterns (questions)
        const questions = headings.filter((h: string) => h.includes('?') || h.includes('？') || /how|what|why|when|where/i.test(h));
        console.log(`\n❓ Potential PAA Questions used as Headings: ${questions.length}`);
        questions.forEach((q: string) => console.log(`   ${q}`));

        // Check suggestions/intelligence metadata if available
        if (data.metadata) {
            console.log('\n📊 Metadata:', data.metadata);
        }

    } catch (e) {
        console.error('Error checking content:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestContent();
