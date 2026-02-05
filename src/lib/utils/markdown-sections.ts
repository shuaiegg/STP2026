/**
 * Markdown Section Parser
 * Splits a markdown document into H2-delimited sections for granular editing.
 */

export interface ContentSection {
    id: string;
    heading: string; // The H2 text (without ##)
    body: string;    // The content following the heading
    fullText: string; // The complete ## Heading + Body
}

/**
 * Splits markdown by H2 headers (## )
 */
export function parseMarkdownToSections(markdown: string): ContentSection[] {
    if (!markdown) return [];

    // Split by lines that start with ## (but not ###)
    // We use a regex lookahead to split but keep the delimiter, 
    // or we can manually parse it line by line which is safer.

    const lines = markdown.split('\n');
    const sections: ContentSection[] = [];

    let currentId = crypto.randomUUID();
    let currentHeading = "Intro";
    let currentBuffer: string[] = [];

    // Check if the first line is NOT a heading (e.g. Intro text)
    if (!lines[0]?.startsWith('## ')) {
        // Initial buffer for intro
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Found a new H2 heading
        if (line.startsWith('## ') && !line.startsWith('### ')) {
            // Push previous section if it has content
            if (currentBuffer.length > 0 || currentHeading !== "Intro") {
                sections.push({
                    id: currentId,
                    heading: currentHeading,
                    body: currentBuffer.join('\n').trim(),
                    fullText: (currentHeading === "Intro" ? "" : `## ${currentHeading}\n\n`) + currentBuffer.join('\n').trim()
                });
            }

            // Start new section
            currentId = crypto.randomUUID();
            currentHeading = line.replace('## ', '').trim();
            currentBuffer = [];
        } else {
            currentBuffer.push(line);
        }
    }

    // Push the final section
    if (currentBuffer.length > 0 || currentHeading !== "Intro") {
        sections.push({
            id: currentId,
            heading: currentHeading,
            body: currentBuffer.join('\n').trim(),
            fullText: (currentHeading === "Intro" ? "" : `## ${currentHeading}\n\n`) + currentBuffer.join('\n').trim()
        });
    }

    return sections;
}

/**
 * Joins sections back into a single markdown string
 */
export function joinSectionsToMarkdown(sections: ContentSection[]): string {
    return sections.map(s => {
        if (s.heading === 'Intro') return s.body;
        return `## ${s.heading}\n\n${s.body}`;
    }).join('\n\n');
}
