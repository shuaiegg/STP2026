
import 'dotenv/config';
import { StellarWriterSkill } from '../src/lib/skills/skills/stellar-writer';

async function runPerfTest() {
    console.log('🚀 Starting Performance Test...');
    const skill = new StellarWriterSkill();

    const input = {
        keywords: 'project management software for small business',
        location: 'United States',
        analyzeCompetitors: true,
        auditOnly: false // Full generation to test AI speed
    };

    try {
        const start = Date.now();
        // We need to bypass the protected executeInternal execution wrapper usually handled by BaseSkill
        // But since executeInternal is protected, we can't call it directly easily without casting or extending.
        // Easier way: call the public execute() method if available, or use the run method if the skill exposes one.
        // BaseSkill has execute() as public.

        // Mocking the context or just running it.
        const result = await skill.execute(input);

        console.log('✅ Test Complete');
        // The logs inside StellarWriter will print to console

    } catch (e) {
        console.error('Test failed:', e);
    }
}

runPerfTest();
