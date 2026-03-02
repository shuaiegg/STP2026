import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve('.env') });

async function test() {
    console.log("Testing Stellar test endpoint...");
    try {
        const response = await fetch('http://localhost:3000/api/test-stellar');
        const data = await response.json();
        
        console.log("Analysis Output Outline Length:", data.analysis?.masterOutline?.length);
        
        if(data.analysis?.masterOutline) {
          const hasPAA = data.analysis.masterOutline.some(o => o.text.includes("FAQ") || o.text.includes("Frequently Asked"));
          console.log("Outline has FAQ section:", hasPAA);
          console.log(data.analysis.masterOutline);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
