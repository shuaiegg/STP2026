import { UnsplashImage } from '@/lib/external/image-finder';

export class MarkdownImagePlacer {
    /**
     * Intelligently parses Markdown and inserts image placeholders
     * at optimal points (e.g., after H1, and distributed across H2 sections).
     */
    static insertImages(content: string, images: UnsplashImage[]): string {
        if (!content || !images || images.length === 0) return content;

        const lines = content.split('\n');
        const newLines: string[] = [];
        let imageIndex = 0;

        let foundH1 = false;
        let h2Count = 0;

        // Count H2s to space out images
        const totalH2 = lines.filter(l => l.trim().startsWith('## ')).length;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            newLines.push(line);

            // Image 1: After H1
            if (!foundH1 && line.trim().startsWith('# ') && imageIndex < images.length) {
                foundH1 = true;
                // Add an empty line before inserting
                if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
                    newLines.push('');
                }
                newLines.push(`![${images[imageIndex].alt}](${images[imageIndex].url})`);
                newLines.push(`*Image via ${images[imageIndex].credit}*`);
                newLines.push('');
                imageIndex++;
                continue;
            }

            // Spacing remaining images
            if (line.trim().startsWith('## ') && imageIndex < images.length && foundH1) {
                h2Count++;
                // Dynamic spacing based on remaining images and remaining H2s
                const remainingImages = images.length - imageIndex;
                const remainingH2s = totalH2 - h2Count + 1;

                // If the number of remaining H2s is roughly equal to or slightly more than remaining images, insert
                // But don't insert on the very first H2 immediately after H1
                if (h2Count > 1 && remainingH2s <= remainingImages + 1) {
                    newLines.push('');
                    newLines.push(`![${images[imageIndex].alt}](${images[imageIndex].url})`);
                    newLines.push(`*Image via ${images[imageIndex].credit}*`);
                    newLines.push('');
                    imageIndex++;
                }
            }
        }

        // If no H1 was found, but we still have the first image, insert at top
        if (!foundH1 && imageIndex < images.length) {
            newLines.unshift('');
            newLines.unshift(`*Image via ${images[imageIndex].credit}*`);
            newLines.unshift(`![${images[imageIndex].alt}](${images[imageIndex].url})`);
            imageIndex++;
        }

        return newLines.join('\n');
    }
}
