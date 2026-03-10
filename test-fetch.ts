import { fetchHtml } from './src/lib/skills/site-intelligence/crawler/fetcher';

async function main() {
    const url = 'https://www.copy.ai';
    console.log(`Fetching ${url}...`);
    const { html, loadTime, status } = await fetchHtml(url);
    console.log(`Status: ${status}`);
    console.log(`LoadTime: ${loadTime}ms`);
    console.log(`HTML Length: ${html?.length || 0}`);
    if (html) {
        console.log(html.substring(0, 500));
    }
}

main().catch(console.error);
