import { createAuthClient } from "better-auth/react";
import { emailOTPClient, forgetPasswordClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [
        emailOTPClient(),
        forgetPasswordClient()
    ]
});
