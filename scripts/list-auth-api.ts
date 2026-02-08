import { auth } from "../src/lib/auth";

async function listApi() {
    console.log("🔍 [Better Auth] Listing API methods...");
    const keys = Object.keys(auth.api);
    console.log("API Keys:", keys);
    
    // Check if setPassword or updatePassword exists
    const userMethods = Object.keys((auth.api as any).user || {});
    console.log("User Methods:", userMethods);
}

listApi();
