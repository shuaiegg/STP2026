import { StellarWriterSkill } from '../src/lib/skills/skills/stellar-writer';
import dotenv from 'dotenv';
import path from 'path';

// Load env from project root
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testStellarWriter() {
    console.log('--- 🧪 StellarWriter Self-Test ---');
    const skill = new StellarWriterSkill();
    
    const input = {
        keywords: 'industrial valve supplier',
        location: 'Houston',
        auditOnly: true
    };

    console.log('Executing with input:', JSON.stringify(input, null, 2));
    
    try {
        const result = await skill.execute(input);
        console.log('Result Success:', result.success);
        if (result.success) {
            console.log('Data returned:', result.data ? 'YES' : 'NULL');
            if (result.data) {
                console.log('Topics count:', result.data.topics?.length || 0);
                console.log('Entities count:', result.data.entities?.length || 0);
                console.log('Competitors count:', result.data.competitors?.length || 0);
            }
        } else {
            console.error('Execution Error:', result.error);
        }
    } catch (err) {
        console.error('Caught Error:', err);
    }
}

testStellarWriter();
