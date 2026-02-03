/**
 * Skills exports
 */

export * from './seo-optimizer';
export * from './geo-writer';

// Import skills for auto-registration
import { SEOOptimizerSkill } from './seo-optimizer';
import { GEOWriterSkill } from './geo-writer';
import { getSkillRegistry } from '../skill-registry';

/**
 * Register all skills with the registry
 */
export function registerAllSkills(): void {
    const registry = getSkillRegistry();

    // Register using factories for lazy loading
    registry.registerFactory('seo-optimizer', () => new SEOOptimizerSkill());
    registry.registerFactory('geo-writer', () => new GEOWriterSkill());

    // Add more skills here as they are created
}
