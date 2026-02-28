import { describe, it, expect } from 'vitest';
import { parseMarkdownToSections, joinSectionsToMarkdown } from '../markdown-sections';

describe('markdown-sections', () => {
    describe('parseMarkdownToSections', () => {
        it('should split markdown by H2 headers', () => {
            const markdown = `Intro text.

## Section 1
Content of section 1.

## Section 2
Content of section 2.
- list item`;

            const sections = parseMarkdownToSections(markdown);

            expect(sections).toHaveLength(3);
            expect(sections[0].heading).toBe('Intro');
            expect(sections[0].body).toBe('Intro text.');
            expect(sections[1].heading).toBe('Section 1');
            expect(sections[1].body).toBe('Content of section 1.');
            expect(sections[2].heading).toBe('Section 2');
            expect(sections[2].body).toBe('Content of section 2.\n- list item');
        });

        it('should return empty array for empty input', () => {
            expect(parseMarkdownToSections('')).toEqual([]);
        });

        it('should handle markdown starting with H2', () => {
            const markdown = `## Heading 1
Body 1`;
            const sections = parseMarkdownToSections(markdown);
            expect(sections).toHaveLength(1);
            expect(sections[0].heading).toBe('Heading 1');
            expect(sections[0].body).toBe('Body 1');
        });
    });

    describe('joinSectionsToMarkdown', () => {
        it('should reconstruct original markdown', () => {
            const markdown = `Intro text.

## Section 1

Content 1.`;
            const sections = parseMarkdownToSections(markdown);
            const joined = joinSectionsToMarkdown(sections);
            expect(joined).toContain('Intro text.');
            expect(joined).toContain('## Section 1');
            expect(joined).toContain('Content 1.');
        });
    });
});
