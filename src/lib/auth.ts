import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        // We let Prisma handle the fields and defaults. 
        // Better Auth will include these in the session if they exist in the DB.
    },
    // Optional: Add session settings
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [
        "http://localhost:3000",
        "http://192.168.1.11:3000",
        "https://stp.carpartsluxury.com"
    ],
    // You can add more advanced settings here like cross-domain cookies if needed
});
