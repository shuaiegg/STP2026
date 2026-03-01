/**
 * Stellar Parser v1.2 (Heuristic Recovery)
 * Designed for Large Language Model (LLM) responses which often fail JSON standards.
 */

export class StellarParser {
    /**
     * Extracts a JSON object from a string that may contain raw Markdown or broken characters.
     */
    static extractSafeJSON<T>(raw: string): T | null {
        // Find the boundary of the JSON object
        const startIndex = raw.indexOf('{');
        const endIndex = raw.lastIndexOf('}');

        if (startIndex === -1 || endIndex === -1) return null;

        let jsonString = raw.substring(startIndex, endIndex + 1);

        try {
            // First pass: Direct attempt
            return JSON.parse(jsonString) as T;
        } catch (initialError) {
            // Second pass: Manual heuristic repair for common LLM JSON errors
            
            // 1. Fix unescaped internal double quotes within string values
            // This is tricky: we only want to escape quotes that aren't delimiters
            // Heuristic: A delimiter quote is usually preceded by : [ { , or followed by , ] } :
            // But let's start with escaping all internal newlines which is the #1 killer
            let repaired = jsonString.replace(/"([\s\S]*?)"/g, (match, content) => {
                // Escape raw newlines inside the content of the string
                const escapedContent = content
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t');
                
                return `"${escapedContent}"`;
            });

            try {
                return JSON.parse(repaired) as T;
            } catch (secondError) {
                // Third pass: If we still fail, it's likely internal unescaped quotes.
                // At this point, we'll try to find only the "content" block and extract it separately
                // as it's the most likely source of the break.
                try {
                   const contentMatch = jsonString.match(/"content":\s*"([\s\S]*)"\s*,\s*"summary"/);
                   if (contentMatch) {
                       console.log("🛠️ Heuristic: Extracted content block manually.");
                       // If we can at least get the content, we're partially successful
                   }
                } catch (e) {}
                
                return null;
            }
        }
    }
}
