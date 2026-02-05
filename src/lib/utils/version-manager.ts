/**
 * Version Management for GEO Writer
 * Saves and restores article snapshots using localStorage
 */

export interface VersionSnapshot {
    timestamp: number;
    content: string;
    sectionCount: number;
    metadata: {
        title: string;
        humanScore?: number;
    };
}

const HISTORY_KEY_PREFIX = 'geo-writer-history-';

/**
 * Save a new version of the article
 */
export function saveSnapshot(articleId: string, content: string, sectionCount: number, metadata: { title: string; humanScore?: number }) {
    if (typeof window === 'undefined') return;

    const key = `${HISTORY_KEY_PREFIX}${articleId}`;
    const historyJson = localStorage.getItem(key);
    let history: VersionSnapshot[] = historyJson ? JSON.parse(historyJson) : [];

    const newSnapshot: VersionSnapshot = {
        timestamp: Date.now(),
        content,
        sectionCount,
        metadata
    };

    // Add to history and keep only latest 10 versions
    history = [newSnapshot, ...history].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(history));

    return history;
}

/**
 * Retrieve version history for an article
 */
export function getVersionHistory(articleId: string): VersionSnapshot[] {
    if (typeof window === 'undefined') return [];

    const key = `${HISTORY_KEY_PREFIX}${articleId}`;
    const historyJson = localStorage.getItem(key);
    return historyJson ? JSON.parse(historyJson) : [];
}

/**
 * Clear history for a specific article
 */
export function clearHistory(articleId: string) {
    if (typeof window === 'undefined') return;
    const key = `${HISTORY_KEY_PREFIX}${articleId}`;
    localStorage.removeItem(key);
}
