export const TOOL_COSTS = {
    /**
     * Standard GEO Writer (Full Article Generation)
     * Includes: SERP Analysis, Keyword Research, Content Generation, Optimization
     */
    GEO_WRITER_FULL: 35,

    /**
     * GEO Writer - Audit Only (Step 1)
     * Includes: SERP Analysis, Keyword Research, Audit Report
     */
    GEO_WRITER_AUDIT: 5,

    /**
     * Debug/Test Mode
     * Low cost for internal testing
     */
    DEBUG_MODE: 1,
} as const;
