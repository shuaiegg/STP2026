/**
 * Skills exports
 */

export * from './stellar-writer';

// Import skills for auto-registration
import { StellarWriterSkill } from './stellar-writer';
import { getSkillRegistry } from '../skill-registry';

/**
 * Register all skills with the registry
 */
export function registerAllSkills(): void {
    const registry = getSkillRegistry();

    // Register using factories for lazy loading
    registry.registerFactory('stellar-writer', () => new StellarWriterSkill());

    // Add more skills here as they are created
}
