/**
 * Main entry point for the Skills system
 */

export * from './types';
export * from './base-skill';
export * from './skill-registry';
export * from './providers';

// Re-export commonly used functions
export { getSkillRegistry } from './skill-registry';
export { getProvider, getDefaultProvider, getAvailableProviders } from './providers';
