import { MarkdownImagePlacer } from '../src/lib/skills/skills/stellar/utils/image-placer';
import { StellarEnricher } from '../src/lib/skills/skills/stellar/StellarEnricher';

async function run() {
    const rawMarkdown = `
# How to Start a Garden

Starting a garden is a rewarding experience.

## Step 1: Choose a Location

You need a sunny spot for most vegetables.

## Step 2: Prepare the Soil

Good soil means good plants. Add compost to improve it.

## Step 3: Pick Your Plants

Start with easy ones like tomatoes or lettuce.

## Step 4: Water and Weeds

Keep them watered and pull weeds when they appear.

## Conclusion

Enjoy your fresh vegetables!
`;

    console.log("=== Original Content ===");
    console.log(rawMarkdown);

    // Test Enrichment (which calls ImagePlacer internally via ImageFinder mock)
    // Actually StellarEnricher.enrich calculates SEO Score which requires some imports. Let's trace it.
    // Assuming `seo-scoring.ts` works fine in dev environment.

    try {
        const enriched = await StellarEnricher.enrich(
            rawMarkdown,
            "How to Start a Garden",
            "A comprehensive guide to starting your first garden.",
            "garden",
            ["gardening basics"],
            ["vegetables", "soil"],
            "Tester"
        );

        console.log("\\n=== Enriched Content (with images) ===");
        console.log(enriched.content);

        console.log("\\n=== Images Inserted: ===");
        const finalLines = enriched.content.split('\\n');
        finalLines.forEach(l => {
            if (l.trim().startsWith('![')) {
                console.log(l);
            }
        });

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();
