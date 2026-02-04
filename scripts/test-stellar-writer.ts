import { StellarWriterSkill } from '../src/lib/skills/skills/stellar-writer';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    console.log('--- Testing StellarWriter Skill ---');
    const skill = new StellarWriterSkill();
    
    const input = {
        keywords: 'Best CRM for SaaS',
        location: 'United States',
        auditOnly: true
    };

    try {
        const result = await (skill as any).executeInternal(input);
        console.log('SUCCESS!');
        console.log('Topics found:', result.data.topics?.length);
        console.log('Topics detail:', JSON.stringify(result.data.topics, null, 2));
    } catch (error) {
        console.error('FAILED:', error);
    }
}

test();
