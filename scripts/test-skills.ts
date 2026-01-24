/**
 * Test script for AI Skills system
 * 
 * Usage: npx tsx scripts/test-skills.ts
 */

// Load environment variables
import 'dotenv/config';

import { getSkillRegistry, getAvailableProviders } from '../src/lib/skills';
import { registerAllSkills } from '../src/lib/skills/skills';
import { SEOOptimizerInput } from '../src/lib/skills/skills/seo-optimizer';

async function main() {
    console.log('🧪 Testing AI Skills System\n');

    // Register skills
    console.log('📦 Registering skills...');
    registerAllSkills();

    const registry = getSkillRegistry();
    const skillNames = registry.getSkillNames();
    console.log(`✅ Registered ${skillNames.length} skills: ${skillNames.join(', ')}\n`);

    // Check available providers
    console.log('🔌 Checking AI providers...');
    const providers = await getAvailableProviders();
    console.log(`✅ Available providers: ${providers.join(', ') || 'None'}\n`);

    if (providers.length === 0) {
        console.log('⚠️  No AI providers available!');
        console.log('Please set GEMINI_API_KEY or ANTHROPIC_API_KEY in .env file\n');
        return;
    }

    // Test SEO Optimizer
    console.log('🚀 Testing SEO Optimizer skill...\n');

    const seoSkill = registry.getSkill('seo-optimizer');
    if (!seoSkill) {
        console.error('❌ SEO Optimizer skill not found!');
        return;
    }

    const testInput: SEOOptimizerInput = {
        content: `# What is Technical SEO?

Technical SEO refers to the process of optimizing your website's infrastructure to help search engines crawl and index your content more effectively.

## Why Technical SEO Matters

Without proper technical SEO, even the best content won't rank well. Search engines need to be able to access, crawl, and understand your content.

## Key Technical SEO Elements

1. Site speed and performance
2. Mobile responsiveness
3. XML sitemaps
4. Robots.txt configuration
5. Structured data markup`,
        contentType: 'TOFU',
        brandName: 'STP2026',
        url: 'https://example.com/technical-seo',
    };

    console.log('Input:', JSON.stringify(testInput, null, 2));
    console.log('\n⏳ Executing skill (this may take 10-30 seconds)...\n');

    const startTime = Date.now();
    const result = await seoSkill.execute(testInput);
    const duration = Date.now() - startTime;

    if (!result.success) {
        console.error('❌ Skill execution failed:', result.error);
        return;
    }

    console.log('✅ Skill executed successfully!\n');
    console.log('📊 Execution Metadata:');
    console.log(`   - Duration: ${duration}ms`);
    console.log(`   - Provider: ${result.metadata.provider}`);
    console.log(`   - Model: ${result.metadata.modelUsed}`);
    console.log(`   - Tokens: ${result.metadata.tokensUsed || 'N/A'}`);
    console.log(`   - Cost: $${result.metadata.cost?.toFixed(4) || 'N/A'}\n`);

    console.log('📝 Output Sample:');
    console.log('   Title:', result.data.seoMetadata?.title || 'N/A');
    console.log('   Description:', result.data.seoMetadata?.description || 'N/A');
    console.log('   Keywords:', result.data.seoMetadata?.keywords?.join(', ') || 'N/A');
    console.log('   GEO Score:', result.data.geoScore || 'N/A');
    console.log('\n✨ Test completed successfully!');
}

main().catch(console.error);
