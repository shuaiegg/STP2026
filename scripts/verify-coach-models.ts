import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- Testing CoachMove and Site Stage ---');

    // 1. Find or create a test site
    let site = await prisma.site.findFirst({
        where: { domain: 'test-coach.com' }
    });

    if (!site) {
        // Need a user first
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('No user found to link site');
            return;
        }
        site = await prisma.site.create({
            data: {
                domain: 'test-coach.com',
                userId: user.id,
                onboardingStage: '0'
            }
        });
        console.log('Created test site');
    }

    console.log('Current site stage:', site.onboardingStage);

    // 2. Create a CoachMove
    const move = await prisma.coachMove.create({
        data: {
            siteId: site.id,
            type: 'connect_gsc',
            stage: '0',
            status: 'suggested',
            evidence: { reason: 'GSC connection is required for growth tracking' },
            payload: { url: '/dashboard/site-intelligence/integrations' },
            priority: 100
        }
    });
    console.log('Created CoachMove:', move.id);

    // 3. Update stage
    const updatedSite = await prisma.site.update({
        where: { id: site.id },
        data: { onboardingStage: '1' }
    });
    console.log('Updated site stage to:', updatedSite.onboardingStage);

    // 4. Query moves
    const moves = await prisma.coachMove.findMany({
        where: { siteId: site.id }
    });
    console.log('Found', moves.length, 'moves for site');

    // 5. Cleanup
    await prisma.coachMove.delete({ where: { id: move.id } });
    console.log('Deleted CoachMove');

    console.log('--- Verification Complete ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
