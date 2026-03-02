import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

async function test() {
    console.log("Testing DataForSEO Client SERP API...");
    
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    const credentials = Buffer.from(`${login}:${password}`).toString('base64');
    
    const payload = [{
        keyword: "Next.js routing best practices",
        location_name: "United States",
        language_name: "English",
        device: "desktop",
        os: "windows",
        depth: 20
    }];

    try {
        const response = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/live/advanced`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const items = data.tasks?.[0]?.result?.[0]?.items || [];
        
        console.log(`Retrieved ${items.length} items.`);
        
        const paa = items.filter(i => i.type === 'people_also_ask');
        console.log("PAA Data:", JSON.stringify(paa, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
