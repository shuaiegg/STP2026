/**
 * Skill Registry - Central registry for all available skills
 * Singleton pattern for global access
 */

import { ISkill, SkillMetadata } from './types';

export class SkillRegistry {
    private static instance: SkillRegistry;
    private skills: Map<string, ISkill> = new Map();
    private skillFactories: Map<string, () => ISkill> = new Map();

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance
     */
    static getInstance(): SkillRegistry {
        if (!SkillRegistry.instance) {
            SkillRegistry.instance = new SkillRegistry();
        }
        return SkillRegistry.instance;
    }

    /**
     * Register a skill instance
     */
    register(skill: ISkill): void {
        if (this.skills.has(skill.name)) {
            console.warn(`Skill ${skill.name} is already registered. Overwriting.`);
        }
        this.skills.set(skill.name, skill);
    }

    /**
     * Register a skill factory for lazy loading
     */
    registerFactory(name: string, factory: () => ISkill): void {
        if (this.skillFactories.has(name)) {
            console.warn(`Skill factory ${name} is already registered. Overwriting.`);
        }
        this.skillFactories.set(name, factory);
    }

    /**
     * Get a skill by name (lazy loads if needed)
     */
    getSkill(name: string): ISkill | null {
        // Check if already instantiated
        if (this.skills.has(name)) {
            return this.skills.get(name)!;
        }

        // Try to lazy load from factory
        const factory = this.skillFactories.get(name);
        if (factory) {
            const skill = factory();
            this.skills.set(name, skill);
            return skill;
        }

        console.error(`Skill ${name} not found in registry`);
        return null;
    }

    /**
     * Get all registered skill names
     */
    getSkillNames(): string[] {
        const instantiated = Array.from(this.skills.keys());
        const factories = Array.from(this.skillFactories.keys());
        return [...new Set([...instantiated, ...factories])];
    }

    /**
     * Get metadata for all skills
     */
    getAllMetadata(): SkillMetadata[] {
        const metadata: SkillMetadata[] = [];

        // Get metadata from instantiated skills
        for (const skill of this.skills.values()) {
            metadata.push(this.extractMetadata(skill));
        }

        // For factories, we need to instantiate to get metadata
        for (const [name, factory] of this.skillFactories.entries()) {
            if (!this.skills.has(name)) {
                const skill = factory();
                metadata.push(this.extractMetadata(skill));
            }
        }

        return metadata;
    }

    /**
     * Get metadata for a specific skill
     */
    getMetadata(name: string): SkillMetadata | null {
        const skill = this.getSkill(name);
        if (!skill) {
            return null;
        }
        return this.extractMetadata(skill);
    }

    /**
     * Extract metadata from a skill instance
     */
    private extractMetadata(skill: ISkill): SkillMetadata {
        // Try to get example input from skill if it has one
        const exampleInput = (skill as any).exampleInput || {};

        // Try to get required/optional inputs from validation
        const validation = skill.validateInput({});
        const requiredInputs = validation.errors
            ?.map(err => {
                const match = err.match(/Missing required field: (\w+)/);
                return match ? match[1] : null;
            })
            .filter((item): item is string => item !== null) || [];

        return {
            name: skill.name,
            description: skill.description,
            version: skill.version,
            category: skill.category,
            requiredInputs,
            optionalInputs: [],
            exampleInput,
            estimatedCost: 0.01, // Default estimate
        };
    }

    /**
     * Check if a skill exists
     */
    hasSkill(name: string): boolean {
        return this.skills.has(name) || this.skillFactories.has(name);
    }

    /**
     * Unregister a skill
     */
    unregister(name: string): void {
        this.skills.delete(name);
        this.skillFactories.delete(name);
    }

    /**
     * Clear all registered skills
     */
    clear(): void {
        this.skills.clear();
        this.skillFactories.clear();
    }

    /**
     * Get skills by category
     */
    getSkillsByCategory(category: string): ISkill[] {
        const skills: ISkill[] = [];

        for (const skillName of this.getSkillNames()) {
            const skill = this.getSkill(skillName);
            if (skill && skill.category === category) {
                skills.push(skill);
            }
        }

        return skills;
    }
}

/**
 * Convenience function to get the registry instance
 */
export function getSkillRegistry(): SkillRegistry {
    return SkillRegistry.getInstance();
}
