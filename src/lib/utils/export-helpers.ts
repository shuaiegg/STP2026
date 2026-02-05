/**
 * Export utilities for GEO Writer
 * Handles multi-format content export
 */

/**
 * Download content as a Markdown file
 */
export function downloadAsMarkdown(content: string, filename: string = 'article.md') {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Convert basic markdown to HTML and download
 */
export function downloadAsHTML(
    content: string,
    metadata: { title?: string; description?: string; keywords?: string[] },
    filename: string = 'article.html'
) {
    // Basic markdown to HTML conversion (you could use a library like marked.js for more features)
    let htmlContent = content
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    htmlContent = `<p>${htmlContent}</p>`;

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title || 'Exported Article'}</title>
    ${metadata.description ? `<meta name="description" content="${metadata.description}">` : ''}
    ${metadata.keywords ? `<meta name="keywords" content="${metadata.keywords.join(', ')}">` : ''}
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
        }
        h1 { font-size: 2.5em; margin-bottom: 0.5em; }
        h2 { font-size: 2em; margin-top: 1.5em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
        h3 { font-size: 1.5em; margin-top: 1.2em; }
        p { margin: 1em 0; }
        strong { font-weight: 600; }
        em { font-style: italic; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Trigger browser print dialog for PDF export
 */
export function triggerPrintPDF() {
    window.print();
}
