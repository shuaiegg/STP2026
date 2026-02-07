import prisma from "../src/lib/prisma";
import { TOOL_COSTS } from "../src/lib/config/credit-costs";

async function syncSkillConfigs() {
    console.log("🔄 Syncing SkillConfigs from TOOL_COSTS to Database...");

    const skills = [
        {
            name: "GEO_WRITER_FULL",
            displayName: "StellarWriter (Full Article)",
            cost: TOOL_COSTS.GEO_WRITER_FULL,
            description: "Complete article generation with SERP analysis and GEO optimization"
        },
        {
            name: "GEO_WRITER_AUDIT",
            displayName: "StellarWriter (Audit Only)",
            cost: TOOL_COSTS.GEO_WRITER_AUDIT,
            description: "Step 1 market research and keyword discovery"
        }
    ];

    for (const skill of skills) {
        await prisma.skillConfig.upsert({
            where: { name: skill.name },
            update: { 
                cost: skill.cost,
                displayName: skill.displayName,
                description: skill.description
            },
            create: {
                name: skill.name,
                displayName: skill.displayName,
                cost: skill.cost,
                description: skill.description
            }
        });
        console.log(`✅ Synced: ${skill.name} -> ${skill.cost} credits`);
    }

    console.log("✨ SkillConfig sync complete.");
}

syncSkillConfigs()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
