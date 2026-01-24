/**
 * Skills exports
 */

export * from './seo-optimizer';

// Import skills for auto-registration
import { SEOOptimizerSkill } from './seo-optimizer';
import { getSkillRegistry } from '../skill-registry';

/**
 * Register all skills with the registry
 */
export function registerAllSkills(): void {
    const registry = getSkillRegistry();

    // Register using factories for lazy loading
    registry.registerFactory('seo-optimizer', () => new SEOOptimizerSkill());

    // Add more skills here as they are created
}
