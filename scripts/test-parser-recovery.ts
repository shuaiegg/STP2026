
import { StellarParser } from '../src/lib/skills/skills/stellar/utils/parser';

async function testParser() {
    console.log("🧪 Testing StellarParser Recovery v1.2...");
    
    // Broken JSON with raw newlines inside a string value
    const brokenJSON = `
    Some preamble text.
    {
        "content": "# Title
        Line one.
        Line two.",
        "summary": "Short summary"
    }
    Postscript.
    `;

    const result = StellarParser.extractSafeJSON(brokenJSON);
    
    if (result && (result as any).content) {
        console.log("✅ Recovery Success!");
        console.log("Extracted Content:", (result as any).content.replace(/\\n/g, '\n'));
    } else {
        console.error("❌ Recovery Failed.");
        process.exit(1);
    }
}

testParser();
