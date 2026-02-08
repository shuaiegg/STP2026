import { auth } from "../src/lib/auth";

async function listRoutes() {
    console.log("🔍 [Better Auth] Listing endpoints...");
    // @ts-ignore
    const routes = auth.options.plugins.find(p => p.id === "email-otp")?.endpoints;
    if (routes) {
        console.log("Endpoints:", Object.keys(routes));
    } else {
        console.log("No email-otp endpoints found.");
    }
}

listRoutes();
