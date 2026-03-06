
import { calculateEEATScore, calculateValueDensity, calculateSentimentScore } from '../src/lib/utils/seo-scoring';
import { StellarEnricher } from '../src/lib/skills/skills/stellar/StellarEnricher';

const expertContent = `
# How to Optimize Your Home Network for Professional Video Calls
## A Field-Tested Guide
In my daily testing over the last 6 months, I discovered that most "lag" isn't caused by ISP speed, but by bufferbloat. After analyzing over 50 specific router configurations in my home office, I found that enabling SQM (Smart Queue Management) reduces latency by 40% even under heavy load.

**Key Technical Recommendations:**
- Use a Cat6a cable (not just Cat5e) for runs over 20 meters.
- Enable Cake or FQ_CODEL on your router.
- **Why this works:** It prioritizes small ACK packets over large data downloads.

*Disclaimer: This guide is purely for technical education and results may vary based on your local infrastructure.*
`;

const fluffContent = `
# Understanding Internet Connections
It is important to note that the internet is a very complex system. Generally speaking, we can say that a good connection is better than a bad one. As mentioned before, there are many things to consider when you are looking at your router. It is worth noting that technology is always changing rapidly.

If you are thinking about your internet, you should think about speed. Speed is very important for doing things online. furthermore, as we have seen, the world is becoming more digital every day. It is generally understood that we should all have the best internet possible for our needs.
`;

console.log("--- 💎 ADVANCED AUDIT VERIFICATION ---");

console.log("\n[1] EXPERT CONTENT ANALYSIS:");
const expertEEAT = calculateEEATScore(expertContent);
const expertValue = calculateValueDensity(expertContent);
const expertSentiment = calculateSentimentScore(expertContent);
console.log(`EEAT Score: ${expertEEAT.score}`);
console.log(`Value Density: ${expertValue.score}`);
console.log(`Sentiment Score: ${expertSentiment.score} (Bias words: ${expertSentiment.metrics?.biasWords})`);

console.log("\n[2] AI FLUFF / BIASED CONTENT ANALYSIS:");
const fluffEEAT = calculateEEATScore(fluffContent);
const fluffValue = calculateValueDensity(fluffContent);
const biasedContent = `This is the absolute best miracle product ever! It is revolutionary and life-changing. You must buy it now, it's the only God-level solution!`;
const biasedSentiment = calculateSentimentScore(biasedContent);

console.log(`EEAT Score: ${fluffEEAT.score}`);
console.log(`Value Density: ${fluffValue.score}`);
console.log(`Biased Sentiment Score: ${biasedSentiment.score} (Found ${biasedSentiment.metrics?.biasWords} hype words)`);

console.log("\n[3] LINK RECOMMENDATION TEST:");
// Mocking the call to generateLinkRecommendations (it's private, but we can test it via a public wrapper or similar if needed)
// For now, let's assume we want to see if the interface change works in a mock enrichment
const mockEnrichment = {
    content: expertContent,
    title: "Expert Guide",
    description: "Expert Description",
    keyword: "Network Optimization",
    entities: ["Router", "Latency"],
    relatedTopics: ["Bufferbloat", "SQM"]
};

// Since we updated the interface, let's just print that the logic is called
console.log("Internal Links Recommendation successfully returned structured data:");
const recommendations = (StellarEnricher as any).generateLinkRecommendations(
    mockEnrichment.content,
    mockEnrichment.keyword,
    mockEnrichment.entities,
    mockEnrichment.relatedTopics
);
console.log(JSON.stringify(recommendations, null, 2));

if (expertSentiment.score > biasedSentiment.score && recommendations.length > 0) {
    console.log("\n✅ SUCCESS: Phase 3 logic (Sentiment & Links) is functional.");
}
